import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface JsonService {
  name?: string;
  technology?: string;
  type?: string;
}

interface JsonApi {
  method?: string;
  path?: string;
  type?: string;
}

interface JsonDatabase {
  type?: string;
  name?: string;
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

    const empty = {
      projects: 0,
      repos: 0,
      diagrams: 0,
      services: 0,
      apis: 0,
      databases: 0,
      technologies: [] as string[],
      securityFindings: 0,
      healthScore: 0,
      securityScore: 0,
      aiScore: 0,
      testCoverage: 0,
      buildStatus: "unknown",
      totalAnalyses: 0,
      failedAnalyses: 0,
    };

    if (!workspace) {
      return NextResponse.json(empty);
    }

    const repoIds = (
      await prisma.repository.findMany({
        where: { project: { workspaceId: workspace.id } },
        select: { id: true },
      })
    ).map((r) => r.id);

    const [
      projectCount,
      repoCount,
      diagramCount,
      analyses,
      securityFindings,
      analysisStats,
    ] = await Promise.all([
      prisma.project.count({ where: { workspaceId: workspace.id } }),
      prisma.repository.count({
        where: { project: { workspaceId: workspace.id } },
      }),
      prisma.diagram.count({
        where: { project: { workspaceId: workspace.id } },
      }),
      prisma.analysis.findMany({
        where: { repositoryId: { in: repoIds }, status: "COMPLETED" },
        select: { services: true, apis: true, databases: true },
      }),
      prisma.securityFinding.findMany({
        where: { repositoryId: { in: repoIds } },
        select: { severity: true },
      }),
      prisma.analysis.groupBy({
        by: ["status"],
        where: { repositoryId: { in: repoIds } },
        _count: { id: true },
      }),
    ]);

    const techSet = new Set<string>();
    let serviceCount = 0;
    let apiCount = 0;
    let databaseCount = 0;

    for (const a of analyses) {
      const services = (a.services as JsonService[]) || [];
      const apis = (a.apis as JsonApi[]) || [];
      const databases = (a.databases as JsonDatabase[]) || [];

      serviceCount += services.length;
      apiCount += apis.length;
      databaseCount += databases.length;

      for (const s of services) {
        if (s.technology) techSet.add(s.technology);
      }
    }

    const totalAnalyses = analysisStats.reduce((sum, s) => sum + s._count.id, 0);
    const failedAnalyses =
      analysisStats.find((s) => s.status === "FAILED")?._count.id ?? 0;
    const completedAnalyses =
      analysisStats.find((s) => s.status === "COMPLETED")?._count.id ?? 0;

    const severityWeights: Record<string, number> = {
      CRITICAL: 40,
      HIGH: 20,
      MEDIUM: 10,
      LOW: 3,
      INFO: 0,
    };
    const rawScore = securityFindings.reduce(
      (sum, f) => sum + (severityWeights[f.severity] ?? 0),
      0
    );
    const totalWeight = securityFindings.length * 40 || 1;
    const securityScore = Math.max(
      0,
      Math.round(100 - (rawScore / totalWeight) * 100)
    );

    const analysisHealth = completedAnalyses > 0
      ? Math.round((completedAnalyses / Math.max(totalAnalyses, 1)) * 100)
      : 0;

    return NextResponse.json({
      projects: projectCount,
      repos: repoCount,
      diagrams: diagramCount,
      services: serviceCount,
      apis: apiCount,
      databases: databaseCount,
      technologies: Array.from(techSet).sort(),
      securityFindings: securityFindings.length,
      healthScore: analysisHealth,
      securityScore,
      aiScore: completedAnalyses > 0 ? Math.round((completedAnalyses / Math.max(totalAnalyses, 1)) * 100) : 0,
      testCoverage: 0,
      buildStatus: failedAnalyses > 0 ? "failing" : "passing",
      totalAnalyses,
      failedAnalyses,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
