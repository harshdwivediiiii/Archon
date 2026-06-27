import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { scanDependencies, getSecurityScore } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!workspace) {
      return NextResponse.json({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
    }

    const repoIds = (
      await prisma.repository.findMany({
        where: { project: { workspaceId: workspace.id } },
        select: { id: true },
      })
    ).map((r) => r.id);

    const findings = await prisma.securityFinding.findMany({
      where: { repositoryId: { in: repoIds } },
      select: { severity: true },
    });

    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      const key = f.severity.toLowerCase() as keyof typeof counts;
      if (key in counts) counts[key]++;
    }

    return NextResponse.json({
      total: findings.length,
      ...counts,
      lastScan: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Security overview error:", error);
    return NextResponse.json({ error: "Failed to fetch security data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { dependencies } = body;

    if (!dependencies || typeof dependencies !== "object") {
      return NextResponse.json({ error: "dependencies object is required" }, { status: 400 });
    }

    const result = scanDependencies({ dependencies });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Dependency scan error:", error);
    return NextResponse.json({ error: "Failed to scan dependencies" }, { status: 500 });
  }
}
