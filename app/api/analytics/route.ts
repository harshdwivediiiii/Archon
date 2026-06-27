import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  getLanguageDistribution,
  getLinesOfCode,
  getCommitFrequency,
  getContributorActivity,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const repositoryId = searchParams.get("repositoryId");

  if (!repositoryId) {
    return NextResponse.json({ error: "repositoryId is required" }, { status: 400 });
  }

  try {
    const repo = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { id: true, name: true, fullName: true },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { repositoryId },
      select: { files: true },
    });

    if (!analysis?.files) {
      return NextResponse.json({
        repositoryId: repo.id,
        repositoryName: repo.name,
        languageDistribution: [],
        linesOfCode: { total: 0, byLanguage: {}, averages: { perFile: 0 } },
        commitFrequency: [],
        contributorActivity: [],
      });
    }

    const files = analysis.files as Array<{ path: string; lines: number; language?: string }>;

    const languageDistribution = getLanguageDistribution(files);
    const linesOfCode = getLinesOfCode(files);

    return NextResponse.json({
      repositoryId: repo.id,
      repositoryName: repo.name,
      languageDistribution,
      linesOfCode,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
