import { NextRequest, NextResponse } from "next/server";
import { cache, generateCacheKey } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk request
    if (Array.isArray(body)) {
      const results = body.map(({ topic, path }) => {
        if (!topic) return { error: "Topic is required" };
        const cacheKey = generateCacheKey("child-concepts-v2", topic, path || [], "balanced");
        return { topic, ...cache.getMetadata(cacheKey) };
      });
      return NextResponse.json(results);
    }

    // Handle single request
    const { topic, path } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Generate cache key (same as in groqActions)
    const cacheKey = generateCacheKey("child-concepts-v2", topic, path || [], "balanced");

    // Get cache metadata
    const metadata = cache.getMetadata(cacheKey);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error checking cache:", error);
    return NextResponse.json(
      { error: "Failed to check cache" },
      { status: 500 }
    );
  }
}
