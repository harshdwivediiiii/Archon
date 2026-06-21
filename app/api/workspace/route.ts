import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

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

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}
