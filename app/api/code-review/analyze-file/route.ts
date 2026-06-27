import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewCode } from "@/lib/codereview";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "content is required and must be a string" }, { status: 400 });
    }

    const filename = body.filename || "unknown";
    const language = body.language || "unknown";

    const result = reviewCode(body.content, filename, language);
    return NextResponse.json({ file: filename, language, ...result }, { status: 200 });
  } catch (error) {
    console.error("Analyze file error:", error);
    return NextResponse.json({ error: "Failed to analyze file" }, { status: 500 });
  }
}
