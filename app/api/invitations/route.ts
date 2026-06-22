import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
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
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: workspace.id, user: { email } },
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: "MEMBER",
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        workspaceId: workspace.id,
        inviterId: session.user.id,
      },
    });

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Invitation creation error:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
