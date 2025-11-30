import { NextRequest, NextResponse } from "next/server";
import { getSurpriseConcept } from "@/actions/groqActions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const exploredTopics = Array.isArray(body.exploredTopics)
      ? body.exploredTopics
      : [];

    const result = await getSurpriseConcept(exploredTopics);

    if (!result) {
      return NextResponse.json(
        { error: "Could not generate a surprise concept" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in surprise API:", error);
    return NextResponse.json(
      { error: "Error generating surprise concept" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const result = await getSurpriseConcept([]);

    if (!result) {
      return NextResponse.json(
        { error: "Could not generate a surprise concept" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in surprise API:", error);
    return NextResponse.json(
      { error: "Error generating surprise concept" },
      { status: 500 },
    );
  }
}
