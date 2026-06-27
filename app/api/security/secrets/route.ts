import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scanForSecrets } from "@/lib/security";

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

    const findings = scanForSecrets(body.content, filename);

    return NextResponse.json({
      filename,
      total: findings.length,
      findings,
    }, { status: 200 });
  } catch (error) {
    console.error("Secrets scan error:", error);
    return NextResponse.json({ error: "Failed to scan for secrets" }, { status: 500 });
  }
}
