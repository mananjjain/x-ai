// ✅ Serverless Edge Function for Vercel
// Handles Gemini API calls for Desi Tweet Generator 🔥

export const config = {
  runtime: 'edge',
};

export default async (req) => {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  const body = await req.json();
  const { topic, apiKey } = body;

  // Validate inputs
  if (!topic || !apiKey) {
    return new Response(JSON.stringify({ error: 'Topic aur API key dono chahiye!' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    // Parse tweets from numbered list
    const tweetMatches = generatedText.match(/^\d+\.\s*(.+)$/gm);
    const tweets = tweetMatches?.map((line) => line.replace(/^\d+\.\s*/, '').trim()) || [];

    if (tweets.length === 0) {
      throw new Error('Could not parse tweets');
    }

    // Success ✅
    return new Response(JSON.stringify({ tweets }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Error handling
    return new Response(
      JSON.stringify({ error: error.message || 'Kuch gadbad ho gayi bhai!' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
