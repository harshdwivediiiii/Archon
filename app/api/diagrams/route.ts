import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!workspace) {
    return NextResponse.json([]);
  }

  const where: Record<string, unknown> = {};
  if (projectId) {
    where.projectId = projectId;
  } else {
    const projects = await prisma.project.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true },
    });
    where.projectId = { in: projects.map((p) => p.id) };
  }

  const diagrams = await prisma.diagram.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(diagrams);
}
