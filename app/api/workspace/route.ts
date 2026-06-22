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
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { projects: true, chats: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    memberCount: workspace.members.length,
    projectCount: workspace._count.projects,
    chatCount: workspace._count.chats,
    members: workspace.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    const slug = name?.toLowerCase().replace(/\s+/g, "-") || `workspace-${Date.now()}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: name || "My Workspace",
        slug: `${slug}-${Date.now().toString(36)}`,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    });
  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
