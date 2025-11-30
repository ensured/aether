import { NextRequest, NextResponse } from "next/server";
import { getConceptInfo } from "@/actions/groqActions";

export async function POST(request: NextRequest) {
  try {
    const { topic, path } = await request.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { info: "Invalid topic provided" },
        { status: 400 },
      );
    }

    const normalizedPath = Array.isArray(path) ? path : [];

    const info = await getConceptInfo(topic, normalizedPath);

    return NextResponse.json({ info });
  } catch (error) {
    console.error("Error in node-info API:", error);
    return NextResponse.json(
      { info: "Error loading information" },
      { status: 500 },
    );
  }
}
