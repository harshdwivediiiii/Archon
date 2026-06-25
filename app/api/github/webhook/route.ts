import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { runAnalysis } from "@/lib/analysis";
import { publishProgress } from "@/lib/analysis/progress";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const event = req.headers.get("x-github-event");
  const delivery = req.headers.get("x-github-delivery");

  if (!event || !delivery) {
    return NextResponse.json({ error: "Missing GitHub headers" }, { status: 400 });
  }

  const payload = JSON.parse(body);

  if (event === "push") {
    const repoFullName = payload.repository?.full_name;
    if (!repoFullName) {
      return NextResponse.json({ error: "Missing repository name" }, { status: 400 });
    }

    const repository = await prisma.repository.findFirst({
      where: { fullName: repoFullName },
      include: {
        project: { include: { workspace: true } },
      },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const account = await prisma.account.findFirst({
      where: { userId: repository.project.workspace.ownerId, provider: "github" },
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "GitHub token not found for owner" }, { status: 400 });
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

    const cloneUrl = `https://oauth2:${account.access_token}@github.com/${repoFullName}.git`;

    runAnalysis(repository.id, repoFullName, cloneUrl, (progress) => {
      publishProgress(progress);
    }).catch((err) => {
      console.error("Webhook analysis failed:", err);
      publishProgress({
        analysisId: repository.id,
        stage: "failed",
        progress: 0,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Analysis failed",
      });
    });

    return NextResponse.json({ success: true, analysisId: analysis.id });
  }

  if (event === "ping") {
    return NextResponse.json({ msg: "pong" });
  }

  return NextResponse.json({ event, ignored: true });
}
