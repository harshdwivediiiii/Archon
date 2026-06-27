import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDocumentation, getDocTypes, getDocTypeLabel, DocType } from "@/lib/documentation";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const types = getDocTypes().map((type) => ({
    value: type,
    label: getDocTypeLabel(type),
  }));

  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getEnv().OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI service is not configured. Please set OPENAI_API_KEY in your environment." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { type, context, repositoryInfo } = body;

    if (!type || !context) {
      return NextResponse.json(
        { error: "Documentation type and context are required" },
        { status: 400 }
      );
    }

    const validTypes = getDocTypes();
    if (!validTypes.includes(type as DocType)) {
      return NextResponse.json(
        { error: `Invalid documentation type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (context.length > 10000) {
      return NextResponse.json(
        { error: "Context exceeds maximum length of 10,000 characters" },
        { status: 400 }
      );
    }

    const doc = await generateDocumentation(type as DocType, context, repositoryInfo);

    return NextResponse.json({ doc });
  } catch (error) {
    const err = error as { status?: number; code?: string; message?: string };
    const isQuotaError = err.status === 429 || err.code === "insufficient_quota";

    if (isQuotaError) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable due to rate limiting. Please try again later." },
        { status: 429 }
      );
    }

    console.error("Doc generation error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to generate documentation. Please try again." },
      { status: 500 }
    );
  }
}
