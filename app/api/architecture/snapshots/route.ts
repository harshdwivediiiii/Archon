import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

async function authorizeRepositoryAccess(repositoryId: string, userId: string) {
  const repo = await prisma.repository.findFirst({
    where: { id: repositoryId },
    include: { project: { include: { workspace: { include: { members: true } } } } },
  });
  if (!repo) return null;
  const isMember = repo.project.workspace.members.some((m) => m.userId === userId);
  if (!isMember && repo.project.workspace.ownerId !== userId) return null;
  return repo;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repositoryId = req.nextUrl.searchParams.get("repositoryId");
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const snapshot = await prisma.architectureSnapshot.findUnique({
      where: { id },
      include: { repository: true },
    });
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }
    const repo = await authorizeRepositoryAccess(snapshot.repositoryId, session.user.id);
    if (!repo) {
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

  if (!repositoryId) {
    return NextResponse.json({ error: "repositoryId or id required" }, { status: 400 });
  }

  const repo = await authorizeRepositoryAccess(repositoryId, session.user.id);
  if (!repo) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshots = await prisma.architectureSnapshot.findMany({
    where: { repositoryId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { repositoryId, ...data } = body;

  if (!repositoryId) {
    return NextResponse.json({ error: "repositoryId required" }, { status: 400 });
  }

  const repo = await authorizeRepositoryAccess(repositoryId, session.user.id);
  if (!repo) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await prisma.architectureSnapshot.create({
    data: {
      name: data.name || `Snapshot ${new Date().toISOString()}`,
      description: data.description,
      mode: data.mode || "system",
      nodes: data.nodes || [],
      edges: data.edges || [],
      metadata: data.metadata || {},
      commitSha: data.commitSha,
      branch: data.branch,
      tag: data.tag,
      analysisRun: data.analysisRun,
      repositoryId,
    },
  });

  return NextResponse.json(snapshot, { status: 201 });
}
