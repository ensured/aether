import { NextRequest, NextResponse } from "next/server";
import { askConceptQuestion } from "@/actions/groqActions";

export async function POST(request: NextRequest) {
  try {
    const { topic, path, question } = await request.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { answer: "Invalid topic provided" },
        { status: 400 },
      );
    }

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { answer: "Invalid question provided" },
        { status: 400 },
      );
    }

    const normalizedPath = Array.isArray(path) ? path : [];

    const answer = await askConceptQuestion(topic, normalizedPath, question);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error in ask-question API:", error);
    return NextResponse.json(
      { answer: "Error getting answer" },
      { status: 500 },
    );
  }
}
