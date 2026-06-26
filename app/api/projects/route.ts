import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!workspace) {
    return NextResponse.json([]);
  }

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    include: {
      _count: { select: { repositories: true, diagrams: true, documents: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      repoCount: p._count.repositories,
      diagramCount: p._count.diagrams,
      documentCount: p._count.documents,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Project name must be 100 characters or less" }, { status: 400 });
    }

    let workspace = await prisma.workspace.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!workspace) {
      const slug = `workspace-${Date.now().toString(36)}`;
      workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          slug,
          ownerId: session.user.id,
          members: {
            create: {
              userId: session.user.id,
              role: "OWNER",
            },
          },
        },
      });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      repoCount: 0,
      diagramCount: 0,
      documentCount: 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
