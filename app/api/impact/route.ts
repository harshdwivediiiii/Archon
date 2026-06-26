import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const repositoryId = searchParams.get("repositoryId");
  const nodeId = searchParams.get("nodeId");

  if (!repositoryId || !nodeId) {
    return NextResponse.json({ error: "repositoryId and nodeId are required" }, { status: 400 });
  }

  const diagram = await prisma.diagram.findFirst({
    where: {
      metadata: { path: ["repositoryId"], equals: repositoryId },
      type: "architecture",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!diagram) {
    return NextResponse.json({ error: "No diagram found for this repository" }, { status: 404 });
  }

  const nodes = diagram.nodes as Array<{ id: string; data?: { label?: string; description?: string; technology?: string } }>;
  const edges = diagram.edges as Array<{ id: string; source: string; target: string; label?: string }>;

  const sourceNode = nodes.find((n) => n.id === nodeId);
  if (!sourceNode) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  function computeDownstream(startId: string): string[] {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const next = edges
        .filter((e) => e.source === current)
        .map((e) => e.target)
        .filter((t) => !visited.has(t));
      queue.push(...next);
    }
    visited.delete(startId);
    return Array.from(visited);
  }

  function computeUpstream(startId: string): string[] {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const prev = edges
        .filter((e) => e.target === current)
        .map((e) => e.source)
        .filter((s) => !visited.has(s));
      queue.push(...prev);
    }
    visited.delete(startId);
    return Array.from(visited);
  }

  const downstream = computeDownstream(nodeId);
  const upstream = computeUpstream(nodeId);
  const allAffected = [...new Set([...upstream, ...downstream])];
  const blastRadius = allAffected.length;
  const totalNodes = nodes.length;
  const blastPercentage = totalNodes > 0 ? Math.round((blastRadius / totalNodes) * 100) : 0;

  const depthMap: Record<string, number> = {};
  for (const affectedId of allAffected) {
    let depth = 0;
    let current = affectedId;
    const path = [current];
    while (current !== nodeId) {
      const parent = edges.find((e) => e.target === current)?.source;
      if (!parent || path.includes(parent)) break;
      path.push(parent);
      current = parent;
      depth++;
    }
    depthMap[affectedId] = depth;
  }

  const maxDepth = Math.max(0, ...Object.values(depthMap));
  const avgDepth = allAffected.length > 0
    ? Math.round((Object.values(depthMap).reduce((a, b) => a + b, 0) / allAffected.length) * 10) / 10
    : 0;

  let riskScore: "low" | "medium" | "high" | "critical" = "low";
  if (blastPercentage >= 50 || blastRadius >= 10) riskScore = "critical";
  else if (blastPercentage >= 25 || blastRadius >= 5) riskScore = "high";
  else if (blastPercentage >= 10 || blastRadius >= 2) riskScore = "medium";

  const upstreamNodes = upstream
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => ({
      id: n!.id,
      label: n!.data?.label || n!.id,
      depth: depthMap[n!.id] || 0,
    }));

  const downstreamNodes = downstream
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => ({
      id: n!.id,
      label: n!.data?.label || n!.id,
      depth: depthMap[n!.id] || 0,
    }));

  return NextResponse.json({
    nodeId,
    nodeLabel: sourceNode.data?.label || nodeId,
    riskScore,
    blastRadius,
    blastPercentage,
    totalNodes,
    maxDepth,
    avgDepth,
    upstreamCount: upstream.length,
    downstreamCount: downstream.length,
    upstream: upstreamNodes.sort((a, b) => b.depth - a.depth),
    downstream: downstreamNodes.sort((a, b) => a.depth - b.depth),
  });
}
