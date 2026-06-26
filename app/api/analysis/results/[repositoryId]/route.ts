import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repositoryId } = await params;

  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId },
    include: { project: { include: { workspace: { include: { members: true } } } } },
  });

  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const isMember = repository.project.workspace.members.some(
    (m) => m.userId === session.user.id
  );
  const isOwner = repository.project.workspace.ownerId === session.user.id;

  if (!isMember && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analysis = await prisma.analysis.findUnique({
    where: { repositoryId },
  });

  const aiAnalysis = analysis?.aiAnalysis as Record<string, unknown> | null;

  const diagrams = await prisma.diagram.findMany({
    where: {
      OR: [
        { projectId: repository.projectId },
        {
          metadata: {
            path: ["repositoryId"],
            equals: repositoryId,
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const documents = await prisma.document.findMany({
    where: { repositoryId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const workspaceId = repository.project.workspaceId;
  const knowledgeNodes = await prisma.knowledgeNode.findMany({
    where: { workspaceId },
    include: { sourcesFrom: true, targetsTo: true },
  });

  const edgeIds = new Set<string>();
  const graphEdges: unknown[] = [];
  for (const node of knowledgeNodes) {
    for (const edge of node.sourcesFrom) {
      const key = `${edge.sourceId}:${edge.targetId}:${edge.id}`;
      if (!edgeIds.has(key)) {
        edgeIds.add(key);
        graphEdges.push(edge);
      }
    }
    for (const edge of node.targetsTo) {
      const key = `${edge.sourceId}:${edge.targetId}:${edge.id}`;
      if (!edgeIds.has(key)) {
        edgeIds.add(key);
        graphEdges.push(edge);
      }
    }
  }

  const payload: Record<string, unknown> = {
    analysis: analysis ? {
      ...analysis,
      services: analysis.services,
      apis: analysis.apis,
      databases: analysis.databases,
      dependencies: analysis.dependencies,
      infra: analysis.infra,
      modules: analysis.modules,
      events: analysis.events,
      files: analysis.files,
      aiAnalysis,
    } : null,
    diagrams,
    documents,
    graph: { nodes: knowledgeNodes, edges: graphEdges },
    repository: {
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      defaultBranch: repository.defaultBranch,
    },
  };

  return NextResponse.json(payload);
}
