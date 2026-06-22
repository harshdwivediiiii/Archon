import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const repositories = await prisma.repository.findMany({
    where: { project: { workspaceId: workspace.id } },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    repositories.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.fullName,
      description: r.description,
      url: r.url,
      defaultBranch: r.defaultBranch,
      isPrivate: r.isPrivate,
      lastSyncedAt: r.lastSyncedAt,
      projectId: r.projectId,
      projectName: r.project.name,
      createdAt: r.createdAt,
    }))
  );
}
