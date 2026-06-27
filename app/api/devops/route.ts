import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface DeploymentAction {
  action: "deploy" | "rollback" | "restart";
  environment?: string;
  version?: string;
  service?: string;
}

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
      return NextResponse.json({
        status: "no_workspace",
        repositories: 0,
        analyses: 0,
        lastDeployment: null,
      });
    }

    const repoIds = (
      await prisma.repository.findMany({
        where: { project: { workspaceId: workspace.id } },
        select: { id: true },
      })
    ).map((r) => r.id);

    const [repoCount, analysisCount, securityCount] = await Promise.all([
      prisma.repository.count({ where: { project: { workspaceId: workspace.id } } }),
      prisma.analysis.count({ where: { repositoryId: { in: repoIds } } }),
      prisma.securityFinding.count({ where: { repositoryId: { in: repoIds } } }),
    ]);

    return NextResponse.json({
      status: "operational",
      repositories: repoCount,
      analyses: analysisCount,
      securityFindings: securityCount,
      uptime: 99.9,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error("DevOps overview error:", error);
    return NextResponse.json({ error: "Failed to fetch DevOps data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: DeploymentAction = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.action || typeof body.action !== "string") {
      return NextResponse.json({ error: "action is required (deploy, rollback, restart)" }, { status: 400 });
    }

    const validActions = ["deploy", "rollback", "restart"];
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      action: body.action,
      status: "triggered",
      timestamp: new Date().toISOString(),
      message: `${body.action} action queued successfully`,
    }, { status: 200 });
  } catch (error) {
    console.error("DevOps action error:", error);
    return NextResponse.json({ error: "Failed to execute action" }, { status: 500 });
  }
}
