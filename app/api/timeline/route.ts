import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let workspaceId = searchParams.get("workspaceId");

  if (workspaceId) {
    const hasAccess = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });
    if (!hasAccess) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
  } else {
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });
    if (!workspace) {
      return NextResponse.json([]);
    }
    workspaceId = workspace.id;
  }

  const [projects, repositories, diagrams, documents] = await Promise.all([
    prisma.project.findMany({
      where: { workspaceId },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.repository.findMany({
      where: { project: { workspaceId } },
      select: { id: true, fullName: true, createdAt: true, lastSyncedAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.diagram.findMany({
      where: { project: { workspaceId } },
      select: { id: true, name: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.document.findMany({
      where: { project: { workspaceId } },
      select: { id: true, title: true, sourceType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const events: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    date: string;
  }> = [];

  for (const p of projects) {
    events.push({
      id: `project-${p.id}`,
      type: "addition",
      title: `Project created: ${p.name}`,
      description: `New project "${p.name}" was created`,
      category: "project",
      date: p.createdAt.toISOString(),
    });
  }

  for (const r of repositories) {
    events.push({
      id: `repo-${r.id}`,
      type: "addition",
      title: `Repository imported: ${r.fullName}`,
      description: `Repository "${r.fullName}" was imported`,
      category: "repository",
      date: r.createdAt.toISOString(),
    });
    if (r.lastSyncedAt) {
      events.push({
        id: `sync-${r.id}-${r.lastSyncedAt.getTime()}`,
        type: "change",
        title: `Repository synced: ${r.fullName}`,
        description: `Repository "${r.fullName}" was analyzed`,
        category: "repository",
        date: r.lastSyncedAt.toISOString(),
      });
    }
  }

  for (const d of diagrams) {
    events.push({
      id: `diagram-${d.id}`,
      type: "addition",
      title: `Diagram created: ${d.name}`,
      description: `New ${d.type} diagram "${d.name}" was generated`,
      category: "diagram",
      date: d.createdAt.toISOString(),
    });
  }

  for (const d of documents) {
    events.push({
      id: `doc-${d.id}`,
      type: "addition",
      title: `Document generated: ${d.title}`,
      description: `New ${d.sourceType} document "${d.title}" was created`,
      category: "document",
      date: d.createdAt.toISOString(),
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const grouped: Record<string, typeof events> = {};
  for (const event of events) {
    const day = new Date(event.date).toISOString().split("T")[0];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(event);
  }

  const result = Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayEvents]) => ({
      date,
      events: dayEvents.slice(0, 20),
    }));

  return NextResponse.json(result);
}
