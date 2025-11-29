import { NextRequest, NextResponse } from 'next/server';
import { Groq } from "groq-sdk";
import { cache, generateCacheKey } from "@/lib/cache";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { topic, path, question } = await request.json();

    // Generate cache key
    const cacheKey = generateCacheKey('ask-question', topic, path || [], question);
    
    // Check cache first
    const cached = cache.get<string>(cacheKey);
    if (cached) {
      return NextResponse.json({ answer: cached });
    }

    const pathString = Array.isArray(path) && path.length > 0
      ? path.join(" → ") + " → "
      : "";

    const context = pathString ? `Context: ${pathString}${topic}` : topic;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert knowledge assistant. 
          Answer questions about concepts clearly and concisely.
          Keep answers to 2-3 sentences when possible.
          Be helpful and educational.
          If the question is not related to the concept, gently redirect back to the topic.`
        },
        {
          role: "user",
          content: `Concept: ${context}\n\nQuestion: ${question}`
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 200,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || 'No answer available';

    // Cache the result for 1 hour
    cache.set(cacheKey, answer);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in ask-question API:', error);
    return NextResponse.json({ answer: 'Error getting answer' }, { status: 500 });
  }
}
