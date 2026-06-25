import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

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

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!workspace) {
    return NextResponse.json({
      projects: 0, repos: 0, diagrams: 0,
      services: 0, apis: 0, databases: 0,
      technologies: [], securityFindings: 0,
    });
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
    securityCount,
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
    prisma.securityFinding.count({
      where: { repositoryId: { in: repoIds } },
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

  return NextResponse.json({
    projects: projectCount,
    repos: repoCount,
    diagrams: diagramCount,
    services: serviceCount,
    apis: apiCount,
    databases: databaseCount,
    technologies: Array.from(techSet).sort(),
    securityFindings: securityCount,
  });
}
