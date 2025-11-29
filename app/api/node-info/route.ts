import { NextRequest, NextResponse } from 'next/server';
import { Groq } from "groq-sdk";
import { cache, generateCacheKey } from "@/lib/cache";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { topic, path } = await request.json();

    // Generate cache key
    const cacheKey = generateCacheKey('node-info', topic, path || []);
    
    // Check cache first
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ info: cached });
    }

    const pathString = Array.isArray(path) && path.length > 0
      ? path.join(" → ") + " → "
      : "";

    const context = pathString ? `Context: ${pathString}${topic}` : topic;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert knowledge explainer. 
          Provide a concise, informative explanation about the given concept.
          Keep it to 2-3 sentences, focusing on the most important aspects.
          Be educational and clear.`
        },
        {
          role: "user",
          content: `Explain this concept: ${context}`
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 150,
    });

    const info = completion.choices[0]?.message?.content?.trim() || 'No information available';

    // Cache the result for 1 hour
    cache.set(cacheKey, info);

    return NextResponse.json({ info });
  } catch (error) {
    console.error('Error in node-info API:', error);
    return NextResponse.json({ info: 'Error loading information' }, { status: 500 });
  }
}
