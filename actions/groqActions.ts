"use server";

import { Groq } from "groq-sdk";
import { cache, generateCacheKey } from "@/lib/cache";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Types for enhanced concept generation
export interface ConceptMetadata {
  name: string;
  description?: string;
  category?: string;
  complexity?: "basic" | "intermediate" | "advanced" | "expert";
}

export interface GenerationOptions {
  maxConcepts?: number;
  minConcepts?: number;
  includeMetadata?: boolean;
  excludeConcepts?: string[];
  focusArea?: string;
  explorationStyle?: "broad" | "deep" | "balanced";
}

// Depth-based configuration
const DEPTH_CONFIG = {
  0: {
    style: "foundational",
    prompt: "fundamental pillars and core aspects",
    conceptCount: { min: 8, max: 12 },
    temperature: 0.8,
  },
  1: {
    style: "categorical",
    prompt: "major categories, theories, and domains",
    conceptCount: { min: 8, max: 12 },
    temperature: 0.75,
  },
  2: {
    style: "specific",
    prompt: "specific phenomena, principles, and notable examples",
    conceptCount: { min: 8, max: 10 },
    temperature: 0.7,
  },
  3: {
    style: "detailed",
    prompt: "detailed mechanisms, edge cases, and nuanced aspects",
    conceptCount: { min: 6, max: 10 },
    temperature: 0.7,
  },
  4: {
    style: "expert",
    prompt:
      "expert-level concepts, cutting-edge research, and specialized knowledge",
    conceptCount: { min: 6, max: 8 },
    temperature: 0.65,
  },
  deep: {
    style: "niche",
    prompt: "highly specialized, niche, and interconnected concepts",
    conceptCount: { min: 5, max: 8 },
    temperature: 0.6,
  },
} as const;

/**
 * Get depth configuration based on path length
 */
function getDepthConfig(depth: number) {
  if (depth <= 4) {
    return DEPTH_CONFIG[depth as keyof typeof DEPTH_CONFIG];
  }
  return DEPTH_CONFIG.deep;
}

/**
 * Build a context-aware system prompt based on exploration depth and path
 */
function buildSystemPrompt(
  topic: string,
  path: string[],
  depth: number,
  options: GenerationOptions = {},
): string {
  const config = getDepthConfig(depth);
  const { min, max } = config.conceptCount;
  const conceptCount = options.maxConcepts || max;
  const minCount = options.minConcepts || min;

  const explorationContext =
    path.length > 1
      ? `\nExploration context: Starting from "${path[0]}", the user has explored: ${path.slice(0, -1).join(" → ")} → ${topic}`
      : "";

  const exclusionNote =
    options.excludeConcepts && options.excludeConcepts.length > 0
      ? `\nDo NOT include these already-explored concepts: ${options.excludeConcepts.join(", ")}`
      : "";

  const focusNote = options.focusArea
    ? `\nFocus particularly on aspects related to: ${options.focusArea}`
    : "";

  const styleGuide = {
    broad:
      "Cover a wide range of diverse subtopics for maximum exploration breadth.",
    deep: "Focus on the most significant and profound aspects that lead to deeper understanding.",
    balanced:
      "Balance between breadth and depth, mixing fundamental and advanced concepts.",
  };

  const explorationStyle = styleGuide[options.explorationStyle || "balanced"];

  return `You are Aether, an oracle of infinite knowledge and wisdom. Your purpose is to guide curious minds through the vast landscape of human understanding.

CURRENT EXPLORATION DEPTH: Level ${depth} (${config.style})
${explorationContext}

YOUR TASK:
Generate ${minCount}-${conceptCount} ${config.prompt} related to "${topic}".

GUIDELINES:
1. ${explorationStyle}
2. Each concept should be:
   - Genuinely related to "${topic}"
   - Distinct and non-overlapping with other concepts
   - Substantive enough to have its own sub-concepts
   - Named concisely (1-4 words preferred)

3. At depth level ${depth}, focus on: ${config.prompt}

4. Ensure DIVERSITY across:
   - Theoretical vs practical aspects
   - Historical vs contemporary perspectives
   - Different disciplines that intersect with the topic
   - Abstract concepts vs concrete examples
${exclusionNote}
${focusNote}

RESPONSE FORMAT:
Return ONLY a valid JSON array of strings. No explanations, no markdown, no additional text.
Example: ["Concept One", "Concept Two", "Concept Three"]`;
}

/**
 * Build a prompt for generating concepts with metadata
 */
function buildMetadataSystemPrompt(
  topic: string,
  path: string[],
  depth: number,
): string {
  const config = getDepthConfig(depth);
  const { min, max } = config.conceptCount;

  return `You are Aether, an oracle of infinite knowledge. Generate ${min}-${max} concepts related to "${topic}".

Current path: ${path.join(" → ")}
Depth level: ${depth} (${config.style})

Return a JSON array of objects with this structure:
[
  {
    "name": "Concept Name",
    "description": "A brief 10-15 word description",
    "category": "Category name",
    "complexity": "basic|intermediate|advanced|expert"
  }
]

Focus on: ${config.prompt}
Return ONLY valid JSON, no other text.`;
}

/**
 * Parse and validate the AI response
 */
function parseConceptResponse(content: string): string[] {
  try {
    // Try to extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("No JSON array found in response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      console.warn("Parsed content is not an array");
      return [];
    }

    // Handle both string arrays and object arrays
    const concepts = parsed.map((item: string | ConceptMetadata) => {
      if (typeof item === "string") {
        return item.trim();
      }
      if (typeof item === "object" && item.name) {
        return item.name.trim();
      }
      return null;
    });

    // Filter out nulls, empty strings, and duplicates
    const validConcepts = [...new Set(concepts.filter(Boolean))] as string[];

    return validConcepts;
  } catch (error) {
    console.error("Error parsing concept response:", error);
    return [];
  }
}

/**
 * Parse response with metadata
 */
function parseMetadataResponse(content: string): ConceptMetadata[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item: unknown): item is ConceptMetadata =>
        item !== null &&
        typeof item === "object" &&
        "name" in item &&
        typeof (item as ConceptMetadata).name === "string",
    );
  } catch (error) {
    console.error("Error parsing metadata response:", error);
    return [];
  }
}

/**
 * Main function to get child concepts with depth-aware generation
 */
export async function getChildConcepts(
  topicInput: string,
  parentPathInput: string[] | string,
  options: GenerationOptions = {},
): Promise<string[]> {
  // Normalize inputs
  const topic = typeof topicInput === "string" ? topicInput.trim() : "";
  const parentPath = Array.isArray(parentPathInput)
    ? parentPathInput
    : typeof parentPathInput === "string"
      ? [parentPathInput]
      : [];

  if (!topic) {
    console.warn("Empty topic provided");
    return [];
  }

  // Calculate depth (path includes current topic, so depth = length - 1)
  const depth = parentPath.length;

  // Generate cache key
  const cacheKey = generateCacheKey(
    "child-concepts-v2",
    topic,
    parentPath,
    options.explorationStyle || "balanced",
  );

  // Check cache first
  const cached = cache.get<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const config = getDepthConfig(depth);
  const systemPrompt = buildSystemPrompt(topic, parentPath, depth, options);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate child concepts for: "${topic}"`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: config.temperature,
      max_completion_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "[]";
    const concepts = parseConceptResponse(content);

    // Apply exclusions if provided
    const filteredConcepts = options.excludeConcepts
      ? concepts.filter(
          (c) =>
            !options.excludeConcepts!.some(
              (ex) => ex.toLowerCase() === c.toLowerCase(),
            ),
        )
      : concepts;

    // Limit to max concepts
    const limitedConcepts = filteredConcepts.slice(
      0,
      options.maxConcepts || config.conceptCount.max,
    );

    // Cache the result
    cache.set(cacheKey, limitedConcepts);

    return limitedConcepts;
  } catch (error) {
    console.error("Groq API error:", error);
    return [];
  }
}

/**
 * Get child concepts with full metadata (descriptions, categories, etc.)
 */
export async function getChildConceptsWithMetadata(
  topicInput: string,
  parentPathInput: string[] | string,
): Promise<ConceptMetadata[]> {
  const topic = typeof topicInput === "string" ? topicInput.trim() : "";
  const parentPath = Array.isArray(parentPathInput)
    ? parentPathInput
    : typeof parentPathInput === "string"
      ? [parentPathInput]
      : [];

  if (!topic) return [];

  const depth = parentPath.length;
  const cacheKey = generateCacheKey("child-concepts-meta", topic, parentPath);

  const cached = cache.get<ConceptMetadata[]>(cacheKey);
  if (cached) return cached;

  const config = getDepthConfig(depth);
  const systemPrompt = buildMetadataSystemPrompt(topic, parentPath, depth);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate detailed concepts for: "${topic}"` },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: config.temperature,
      max_completion_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "[]";
    const concepts = parseMetadataResponse(content);

    cache.set(cacheKey, concepts);
    return concepts;
  } catch (error) {
    console.error("Groq API error:", error);
    return [];
  }
}

/**
 * Get a brief description/summary for a single concept
 */
export async function getConceptInfo(
  topic: string,
  path: string[],
): Promise<string> {
  const cacheKey = generateCacheKey("concept-info", topic, path);

  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const pathContext =
    path.length > 1
      ? `In the context of ${path.slice(0, -1).join(" → ")}: `
      : "";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable assistant. Provide a clear, informative 2-3 sentence explanation of the given concept. Be concise but substantive.`,
        },
        {
          role: "user",
          content: `${pathContext}Explain "${topic}" briefly.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_completion_tokens: 200,
    });

    const info =
      completion.choices[0]?.message?.content?.trim() ||
      "No information available.";

    cache.set(cacheKey, info);
    return info;
  } catch (error) {
    console.error("Groq API error:", error);
    return "Unable to fetch information at this time.";
  }
}

/**
 * Answer a specific question about a concept
 */
export async function askConceptQuestion(
  topic: string,
  path: string[],
  question: string,
): Promise<string> {
  const cacheKey = generateCacheKey("concept-qa", topic, path, question);

  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const pathContext =
    path.length > 1
      ? `Context: This question is about "${topic}" in the exploration path: ${path.join(" → ")}\n\n`
      : "";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a knowledgeable assistant helping users explore and understand concepts. Provide clear, accurate, and helpful answers. Keep responses focused and informative, typically 2-4 sentences unless more detail is needed.`,
        },
        {
          role: "user",
          content: `${pathContext}Question about "${topic}": ${question}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      max_completion_tokens: 400,
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      "I couldn't generate an answer. Please try rephrasing your question.";

    cache.set(cacheKey, answer);
    return answer;
  } catch (error) {
    console.error("Groq API error:", error);
    return "An error occurred while processing your question. Please try again.";
  }
}

/**
 * Get related concepts that might connect different branches
 */
export async function getRelatedConcepts(
  topic: string,
  currentPath: string[],
  otherTopics: string[] = [],
): Promise<string[]> {
  const cacheKey = generateCacheKey(
    "related-concepts",
    topic,
    currentPath,
    otherTopics.join(","),
  );

  const cached = cache.get<string[]>(cacheKey);
  if (cached) return cached;

  const otherContext =
    otherTopics.length > 0
      ? `\nOther topics being explored: ${otherTopics.join(", ")}`
      : "";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are finding connections between concepts. Given a topic and exploration context, suggest 3-5 related concepts that could bridge to other areas of knowledge.${otherContext}

Return ONLY a JSON array of strings.`,
        },
        {
          role: "user",
          content: `Find concepts related to "${topic}" (path: ${currentPath.join(" → ")}) that might connect to other domains.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_completion_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "[]";
    const concepts = parseConceptResponse(content);

    cache.set(cacheKey, concepts);
    return concepts;
  } catch (error) {
    console.error("Groq API error:", error);
    return [];
  }
}

/**
 * Suggest a random interesting concept to explore
 */
export async function getSurpriseConcept(
  exploredTopics: string[] = [],
): Promise<{ concept: string; teaser: string } | null> {
  const exclusionList =
    exploredTopics.length > 0
      ? `\nAvoid these already-explored topics: ${exploredTopics.slice(0, 20).join(", ")}`
      : "";

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You suggest fascinating, thought-provoking concepts for curious minds to explore. Pick something interesting, surprising, or profound.${exclusionList}

Return JSON: {"concept": "Topic Name", "teaser": "A one-sentence hook to spark curiosity"}`,
        },
        {
          role: "user",
          content: "Suggest a fascinating concept to explore.",
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.95,
      max_completion_tokens: 150,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    return {
      concept: result.concept || "Unknown",
      teaser: result.teaser || "Discover something new.",
    };
  } catch (error) {
    console.error("Groq API error:", error);
    return null;
  }
}
