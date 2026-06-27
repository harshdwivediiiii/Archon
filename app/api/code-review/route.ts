import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewCode, reviewPullRequest } from "@/lib/codereview";

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

    if (body.files) {
      if (!Array.isArray(body.files) || body.files.length === 0) {
        return NextResponse.json({ error: "files must be a non-empty array" }, { status: 400 });
      }
      const result = reviewPullRequest(body.files);
      return NextResponse.json(result, { status: 200 });
    }

    if (body.content) {
      if (typeof body.content !== "string" || body.content.length === 0) {
        return NextResponse.json({ error: "content must be a non-empty string" }, { status: 400 });
      }
      const filename = body.filename || "unknown";
      const language = body.language || "unknown";
      const result = reviewCode(body.content, filename, language);
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(
      { error: "Provide either { content, filename, language } or { files: [...] }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Code review error:", error);
    return NextResponse.json({ error: "Failed to review code" }, { status: 500 });
  }
}
