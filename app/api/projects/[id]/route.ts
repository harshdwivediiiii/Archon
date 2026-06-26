import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id },
    include: {
      _count: { select: { repositories: true, diagrams: true, documents: true } },
      repositories: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: project.workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    description: project.description,
    repoCount: project._count.repositories,
    diagramCount: project._count.diagrams,
    documentCount: project._count.documents,
    repositories: project.repositories.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.fullName,
      description: r.description,
      url: r.url,
      defaultBranch: r.defaultBranch,
      isPrivate: r.isPrivate,
      lastSyncedAt: r.lastSyncedAt,
      createdAt: r.createdAt,
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: project.workspaceId,
      ownerId: session.user.id,
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
