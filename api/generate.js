// Serverless function for Vercel
// This will handle API calls without CORS issues

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, apiKey } = req.body;

  // Validate inputs
  if (!topic || !apiKey) {
    return res.status(400).json({ error: 'Topic aur API key dono chahiye!' });
  }

  const prompt = `You are an elite Indian Twitter content creator. Generate exactly 10 viral Hinglish tweets on the topic: "${topic}". 

Rules:
- Mix Hindi and English naturally (Hinglish)
- Heavy sarcasm, relatable desi situations
- Max 2 lines, 100-150 characters each
- Use words like: yaar, bhai, arrey, matlab, kya, yr, bt
- High sarcasm level, self-deprecating humor
- Bollywood references when natural
- NO religion, politics, caste mentions
- Focus on: Indian life, job struggles, family pressure, education system, traffic, desi problems

Output format (EXACTLY):
1. [tweet]
2. [tweet]
3. [tweet]
...
10. [tweet]

Just give me 10 numbered tweets, nothing else. No explanations, no style labels, just pure Hinglish tweets ready to post.`;

  try {
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    // Parse tweets from numbered list
    const tweetMatches = generatedText.match(/^\d+\.\s*(.+)$/gm);
    
    if (!tweetMatches || tweetMatches.length === 0) {
      throw new Error('Could not parse tweets');
    }

    const tweets = tweetMatches.map(match => 
      match.replace(/^\d+\.\s*/, '').trim()
    );

    // Return tweets
    return res.status(200).json({ tweets });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Kuch gadbad ho gayi bhai!' 
    });
  }
}
