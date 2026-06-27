import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { semanticSearch } from "@/lib/semantic-search";

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

    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json({ error: "query is required and must be a non-empty string" }, { status: 400 });
    }

    let files: Array<{ path: string; content: string }> = [];

    if (body.repositoryId) {
      const analysis = await prisma.analysis.findUnique({
        where: { repositoryId: body.repositoryId },
        select: { files: true },
      });

      if (analysis?.files) {
        const rawFiles = analysis.files as Array<{ path: string; content?: string }>;
        files = rawFiles
          .filter((f) => f.content != null)
          .map((f) => ({ path: f.path, content: f.content! }));
      }
    }

    const result = semanticSearch(
      {
        query: body.query,
        repositoryId: body.repositoryId,
        fileType: body.fileType,
        limit: body.limit,
        offset: body.offset,
      },
      files
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json({ error: "Failed to execute search" }, { status: 500 });
  }
}
