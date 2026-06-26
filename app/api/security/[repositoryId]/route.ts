import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { scanForSecrets, classifyEnvironmentVariables, type SecurityFindingResult } from "@/lib/analysis/security";

export const dynamic = "force-dynamic";

async function checkRepositoryAccess(repositoryId: string, userId: string) {
  const repo = await prisma.repository.findFirst({
    where: { id: repositoryId },
    include: { project: { include: { workspace: { include: { members: true } } } } },
  });
  if (!repo) return null;
  const isMember = repo.project.workspace.members.some((m) => m.userId === userId);
  if (!isMember && repo.project.workspace.ownerId !== userId) return null;
  return repo;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repositoryId } = await params;

  const repo = await checkRepositoryAccess(repositoryId, session.user.id);
  if (!repo) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analysis = await prisma.analysis.findUnique({ where: { repositoryId } });

  const findings = await prisma.securityFinding.findMany({
    where: { repositoryId, dismissed: false },
    orderBy: [{ severity: "asc" }, { discoveredAt: "desc" }],
  });

  const liveFindings: SecurityFindingResult[] = [];
  const envClassifications: Array<{ name: string; category: string; risk: "low" | "medium" | "high"; service?: unknown }> = [];

  if (analysis?.files) {
    const files = analysis.files as Array<{ path: string }>;
    for (const file of files.slice(0, 500)) {
      try {
        const content = "";
        const fileFindings = scanForSecrets(file.path, content);
        liveFindings.push(...fileFindings);
      } catch {
        // skip files that can't be read
      }
    }
  }

  if (analysis?.services) {
    const services = analysis.services as Array<{ envVars?: string[] }>;
    for (const svc of services) {
      if (svc.envVars) {
        const classified = classifyEnvironmentVariables(svc.envVars);
        envClassifications.push(...classified.map((c) => ({ ...c, service: svc })));
      }
    }
  }

  const severityCounts = {
    CRITICAL: findings.filter((f: { severity: string }) => f.severity === "CRITICAL").length,
    HIGH: findings.filter((f: { severity: string }) => f.severity === "HIGH").length,
    MEDIUM: findings.filter((f: { severity: string }) => f.severity === "MEDIUM").length,
    LOW: findings.filter((f: { severity: string }) => f.severity === "LOW").length,
  };

  return NextResponse.json({
    findings,
    liveFindings,
    envClassifications,
    severityCounts,
    totalCount: findings.length,
    scanDate: new Date().toISOString(),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ repositoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repositoryId } = await params;

  const repo = await checkRepositoryAccess(repositoryId, session.user.id);
  if (!repo) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, findingId } = body;

  if (action === "dismiss" && findingId) {
    await prisma.securityFinding.update({
      where: { id: findingId },
      data: { dismissed: true },
    });
    return NextResponse.json({ success: true });
  }

  const analysis = await prisma.analysis.findUnique({ where: { repositoryId } });
  if (!analysis?.files) {
    return NextResponse.json({ error: "No analysis data available for scanning" }, { status: 400 });
  }

  const files = analysis.files as Array<{ path: string; content?: string }>;
  const allFindings: Array<{
    severity: string;
    category: string;
    title: string;
    description?: string;
    filePath: string;
    lineNumber?: number;
    risk?: string;
    recommendation?: string;
  }> = [];

  for (const file of files.slice(0, 1000)) {
    if (!file.content) continue;
    const fileFindings = scanForSecrets(file.path, file.content);
    for (const f of fileFindings) {
      allFindings.push(f);
      await prisma.securityFinding.upsert({
        where: {
          id: `${repositoryId}-${f.filePath}-${f.lineNumber || 0}`,
        },
        create: {
          id: `${repositoryId}-${f.filePath}-${f.lineNumber || 0}`,
          severity: f.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
          category: f.category as "HARDCODED_SECRET" | "API_KEY" | "TOKEN" | "PASSWORD" | "PRIVATE_KEY" | "CONNECTION_STRING" | "EXPOSED_CREDENTIAL" | "UNSAFE_CONFIG" | "PUBLIC_RESOURCE" | "PRIVILEGE_ESCALATION",
          title: f.title,
          description: f.description,
          filePath: f.filePath,
          lineNumber: f.lineNumber,
          codeSnippet: f.codeSnippet,
          risk: f.risk,
          recommendation: f.recommendation,
          repositoryId,
          analysisId: analysis.id,
        },
        update: {},
      });
    }
  }

  return NextResponse.json({ scanned: files.length, findings: allFindings.length });
}
