import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const nodes = await prisma.knowledgeNode.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  const edges = await prisma.knowledgeEdge.findMany({
    where: {
      OR: [
        { source: { workspaceId } },
        { target: { workspaceId } },
      ],
    },
  });

  const resultNodes = nodes.map((n) => ({
    id: n.id,
    label: n.label,
    type: n.type,
    description: n.description,
    connections: edges
      .filter((e) => e.sourceId === n.id || e.targetId === n.id)
      .map((e) => (e.sourceId === n.id ? e.targetId : e.sourceId)),
  }));

  return NextResponse.json({ nodes: resultNodes, edges });
}
