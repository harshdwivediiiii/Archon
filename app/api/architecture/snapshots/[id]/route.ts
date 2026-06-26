import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const snapshot = await prisma.architectureSnapshot.findUnique({
    where: { id },
    include: { repository: true },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const repo = await prisma.repository.findUnique({
    where: { id: snapshot.repositoryId },
    include: { project: { include: { workspace: { include: { members: true } } } } },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const isMember = repo.project.workspace.members.some((m) => m.userId === session.user.id);
  if (!isMember && repo.project.workspace.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [prev, next] = await Promise.all([
    prisma.architectureSnapshot.findFirst({
      where: { repositoryId: snapshot.repositoryId, createdAt: { lt: snapshot.createdAt } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.architectureSnapshot.findFirst({
      where: { repositoryId: snapshot.repositoryId, createdAt: { gt: snapshot.createdAt } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ snapshot, prev, next });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const snapshot = await prisma.architectureSnapshot.findUnique({
    where: { id },
    include: { repository: { include: { project: { include: { workspace: { include: { members: true } } } } } } },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  const repo = snapshot.repository;
  const isMember = repo.project.workspace.members.some((m) => m.userId === session.user.id);
  if (!isMember && repo.project.workspace.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.architectureSnapshot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
