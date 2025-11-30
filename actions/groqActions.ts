"use server";

import { Groq } from "groq-sdk";
import { cache, generateCacheKey } from "@/lib/cache";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function getChildConcepts(
  topicInput: string,
  parentPathInput: string[] | string,
) {
  // Ensure inputs are properly typed and handle potential client references
  const topic = typeof topicInput === "string" ? topicInput : "";
  const parentPath = Array.isArray(parentPathInput)
    ? parentPathInput
    : typeof parentPathInput === "string"
      ? [parentPathInput]
      : [];

  // Generate cache key
  const cacheKey = generateCacheKey("child-concepts", topic, parentPath);

  // Check cache first
  const cached = cache.get<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const pathString =
    parentPath.length > 0 ? parentPath.join(" → ") + " → " : "";

  const context = pathString
    ? `Current exploration path: ${pathString}${topic}\n\n`
    : "";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an oracle of infinite knowledge.
          When given a concept, return 10-20 profound, diverse, and meaningful sub-concepts.
          Return ONLY a valid JSON array of strings. No explanations, no markdown, no extra text.
          Example: ["Quantum Entanglement", "Black Holes", "Dark Matter", "Wormholes"]`,
        },
        {
          role: "user",
          content: `${context}Generate deep child concepts for: "${topic}"`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_completion_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Cache the result for 1 hour
    cache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error("Groq error:", error);
    return [];
  }
}
