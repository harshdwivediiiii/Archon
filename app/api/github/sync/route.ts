import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { analyzeRepository } from "@/lib/ai/repository-analysis";
import { generateKnowledgeGraph } from "@/lib/ai/graph-generation";

async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
  });
  return account?.access_token || null;
}

async function fetchRepoContents(
  token: string,
  fullName: string,
  path: string = ""
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${fullName}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "archon",
      },
    }
  );

  if (!response.ok) return "";

  const items = await response.json();
  if (!Array.isArray(items)) return "";

  let content = "";

  for (const item of items) {
    if (item.type === "dir") {
      if (item.name.startsWith(".") || item.name === "node_modules" || item.name === "dist" || item.name === "build" || item.name === ".next") continue;
      content += await fetchRepoContents(token, fullName, item.path);
    } else if (item.type === "file") {
      const extensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".yaml", ".yml", ".toml", "Dockerfile", ".go", ".py", ".rs", ".rb", ".java", ".kt", ".swift"];
      const shouldInclude = extensions.some((ext) => item.name.endsWith(ext));
      if (!shouldInclude) continue;

      if (item.size > 50000) continue;

      try {
        const fileResp = await fetch(item.download_url, {
          headers: { Authorization: `Bearer ${token}`, "User-Agent": "archon" },
        });
        if (fileResp.ok) {
          const fileContent = await fileResp.text();
          content += `\n--- ${item.path} ---\n${fileContent.slice(0, 2000)}\n`;
        }
      } catch {
        continue;
      }
    }
  }

  return content;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repositoryId } = await req.json();
    if (!repositoryId) {
      return NextResponse.json({ error: "repositoryId is required" }, { status: 400 });
    }

    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId },
      include: { project: { include: { workspace: true } } },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const token = await getGitHubToken(session.user.id);
    if (!token) {
      return NextResponse.json({ error: "GitHub token not found" }, { status: 400 });
    }

    const repoContent = await fetchRepoContents(token, repository.fullName);

    let analysis: Record<string, unknown> = {};
    try {
      analysis = await analyzeRepository(repository.name, repoContent);
    } catch {
      analysis = {
        services: [],
        dependencies: [],
        architecturePatterns: [],
        error: "AI analysis failed",
      };
    }

    let knowledgeGraph: { nodes: Array<{ id: string; label: string; type: string }>; edges: Array<{ source: string; target: string; label?: string }> } = { nodes: [], edges: [] };
    try {
      knowledgeGraph = await generateKnowledgeGraph(repoContent);
    } catch {
      knowledgeGraph = { nodes: [], edges: [] };
    }

    await prisma.document.create({
      data: {
        title: `${repository.name} Architecture Analysis`,
        content: JSON.stringify(analysis),
        sourceType: "github",
        sourceUrl: repository.url,
        projectId: repository.projectId,
        repositoryId: repository.id,
        userId: session.user.id,
      },
    });

    const existingDocs = await prisma.document.count({
      where: { repositoryId: repository.id },
    });

    if (existingDocs <= 1) {
      const nodeMap = new Map<string, string>();
      for (const node of knowledgeGraph.nodes) {
        const created = await prisma.knowledgeNode.create({
          data: {
            label: node.label,
            type: node.type,
            workspaceId: repository.project.workspaceId,
          },
        });
        nodeMap.set(node.id, created.id);
      }

      for (const edge of knowledgeGraph.edges) {
        const sourceId = nodeMap.get(edge.source);
        const targetId = nodeMap.get(edge.target);
        if (sourceId && targetId) {
          await prisma.knowledgeEdge.create({
            data: {
              label: edge.label || null,
              type: "related",
              sourceId,
              targetId,
            },
          });
        }
      }
    }

    const diagram = await prisma.diagram.create({
      data: {
        name: `${repository.name} Architecture`,
        type: "architecture",
        nodes: JSON.parse(JSON.stringify(knowledgeGraph.nodes)),
        edges: JSON.parse(JSON.stringify(knowledgeGraph.edges)),
        projectId: repository.projectId,
      },
    });

    await prisma.repository.update({
      where: { id: repository.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      analysis,
      knowledgeGraph,
      diagramId: diagram.id,
    });
  } catch (error) {
    console.error("Repository sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync repository" },
      { status: 500 }
    );
  }
}
