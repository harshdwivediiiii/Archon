import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { subscribeToAnalysis } from "@/lib/analysis/progress";
import type { AnalysisProgress } from "@/lib/analysis/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { repositoryId } = await params;

  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId },
    include: { project: { include: { workspace: { include: { members: true } } } } },
  });

  if (!repository) {
    return new Response("Repository not found", { status: 404 });
  }

  const isMember = repository.project.workspace.members.some(
    (m) => m.userId === session.user.id
  );
  const isOwner = repository.project.workspace.ownerId === session.user.id;

  if (!isMember && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendProgress = (progress: AnalysisProgress) => {
        try {
          const data = JSON.stringify(progress);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));

          if (progress.status === "COMPLETED" || progress.status === "FAILED") {
            controller.close();
          }
        } catch {
          // Client disconnected
        }
      };

      const unsubscribe = subscribeToAnalysis(repositoryId, sendProgress);

      prisma.analysis
        .findUnique({ where: { repositoryId } })
        .then((analysis) => {
          if (analysis) {
            sendProgress({
              analysisId: repositoryId,
              stage: analysis.stage,
              progress: analysis.progress,
              status: analysis.status,
              error: analysis.error || undefined,
            });

            if (analysis.status === "COMPLETED" || analysis.status === "FAILED") {
              unsubscribe();
            }
          }
        })
        .catch(() => {
          unsubscribe();
          controller.close();
        });

      req.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
