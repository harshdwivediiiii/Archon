import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const SELECT_RE = /^\s*SELECT\s/i;

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

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json({ error: "query is required and must be a non-empty string" }, { status: 400 });
    }

    const trimmed = body.query.trim();

    if (!SELECT_RE.test(trimmed)) {
      return NextResponse.json(
        { error: "Only SELECT queries are allowed for security reasons" },
        { status: 403 }
      );
    }

    const start = performance.now();
    const prisma = getPrisma();
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(trimmed);
    const duration = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      rows,
      rowCount: rows.length,
      duration,
      query: trimmed,
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query execution failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
