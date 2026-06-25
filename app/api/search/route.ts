import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [repositories, documents, diagrams] = await Promise.all([
    prisma.repository.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, fullName: true },
      take: 20,
    }),
    prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, sourceType: true },
      take: 10,
    }),
    prisma.diagram.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, type: true, projectId: true },
      take: 10,
    }),
  ]);

  // also search within analysis JSON fields
  const analyses = await prisma.analysis.findMany({
    where: {
      repositoryId: { in: repositories.map((r) => r.id) },
      status: "COMPLETED",
    },
    select: { repositoryId: true, services: true, apis: true, databases: true },
  });

  const serviceResults: Array<{ id: string; name: string; technology: string; type: string; repositoryId: string }> = [];
  const apiResults: Array<{ method: string; path: string; serviceName: string; repositoryId: string }> = [];
  const dbResults: Array<{ type: string; name: string | null; serviceName: string; repositoryId: string }> = [];

  for (const a of analyses) {
    const services = (a.services as Array<{ name?: string; technology?: string; type?: string }>) || [];
    const apis = (a.apis as Array<{ method?: string; path?: string; type?: string; serviceName?: string }>) || [];
    const databases = (a.databases as Array<{ type?: string; name?: string; serviceName?: string }>) || [];

    for (const s of services) {
      if (s.name && (s.name.toLowerCase().includes(q) || (s.technology || "").toLowerCase().includes(q))) {
        serviceResults.push({
          id: `${a.repositoryId}-${s.name}`,
          name: s.name,
          technology: s.technology || "Unknown",
          type: s.type || "service",
          repositoryId: a.repositoryId,
        });
      }
    }

    for (const api of apis) {
      if (api.method && (api.method.toLowerCase().includes(q) || (api.path || "").toLowerCase().includes(q))) {
        apiResults.push({
          method: api.method,
          path: api.path || "",
          serviceName: api.serviceName || "unknown",
          repositoryId: a.repositoryId,
        });
      }
    }

    for (const db of databases) {
      if (db.type && db.type.toLowerCase().includes(q) && !dbResults.find((r) => r.type === db.type && r.repositoryId === a.repositoryId)) {
        dbResults.push({
          type: db.type,
          name: db.name || null,
          serviceName: db.serviceName || "unknown",
          repositoryId: a.repositoryId,
        });
      }
    }
  }

  const results = [
    ...repositories.map((r) => ({
      id: r.id,
      type: "repository" as const,
      label: r.name,
      subtitle: r.fullName,
      href: `/dashboard/repositories`,
    })),
    ...serviceResults.map((s) => ({
      id: s.id,
      type: "service" as const,
      label: s.name,
      subtitle: `${s.technology} — ${s.type}`,
      href: `/dashboard/architecture?repositoryId=${s.repositoryId}&focus=${encodeURIComponent(s.name)}`,
    })),
    ...apiResults.map((a) => ({
      id: `${a.repositoryId}-${a.method}-${a.path}`,
      type: "api" as const,
      label: `${a.method} ${a.path}`,
      subtitle: a.serviceName,
      href: `/dashboard/architecture?repositoryId=${a.repositoryId}`,
    })),
    ...dbResults.map((d) => ({
      id: `${d.repositoryId}-${d.type}`,
      type: "database" as const,
      label: d.name || d.type,
      subtitle: d.serviceName,
      href: `/dashboard/architecture?repositoryId=${d.repositoryId}`,
    })),
    ...documents.map((d) => ({
      id: d.id,
      type: "document" as const,
      label: d.title,
      subtitle: d.sourceType,
      href: `/dashboard/architecture`,
    })),
    ...diagrams.map((d) => ({
      id: d.id,
      type: "diagram" as const,
      label: d.name,
      subtitle: d.type,
      href: d.projectId ? `/dashboard/architecture?projectId=${d.projectId}` : `/dashboard/architecture`,
    })),
  ];

  return NextResponse.json({ results });
}
