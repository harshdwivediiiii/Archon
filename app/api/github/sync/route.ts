import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { runAnalysis } from "@/lib/analysis";
import { publishProgress } from "@/lib/analysis/progress";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repositoryId } = await req.json();
    if (!repositoryId) {
      return NextResponse.json({ error: "repositoryId is required" }, { status: 400 });
    }

    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId },
      include: { project: { include: { workspace: { include: { members: true } } } } },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const isMember = repository.project.workspace.members.some((m) => m.userId === session.user.id);
    if (!isMember && repository.project.workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "GitHub token not found" }, { status: 400 });
    }

    let analysis = await prisma.analysis.findUnique({
      where: { repositoryId: repository.id },
    });

    if (!analysis) {
      analysis = await prisma.analysis.create({
        data: { repositoryId: repository.id, status: "PENDING" },
      });
    } else {
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: { status: "PENDING", progress: 0, stage: "", error: null, completedAt: null },
      });
    }

    const cloneUrl = `https://oauth2:${account.access_token}@github.com/${repository.fullName}.git`;

    runAnalysis(repository.id, repository.fullName, cloneUrl, (progress) => {
      publishProgress(progress);
    }).catch((err) => {
      console.error("Analysis failed:", err);
      publishProgress({
        analysisId: repository.id,
        stage: "failed",
        progress: 0,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Analysis failed",
      });
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      repositoryId: repository.id,
    });
  } catch (error) {
    console.error("Repository sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync repository" },
      { status: 500 }
    );
  }
}
