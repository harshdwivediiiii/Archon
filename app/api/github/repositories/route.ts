import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "github",
    },
  });
  return account?.access_token || null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getGitHubAccessToken(session.user.id);
  if (!token) {
    return NextResponse.json(
      { error: "GitHub account not connected. Please sign in with GitHub." },
      { status: 400 }
    );
  }

  try {
    const repos: Array<{
      id: number;
      full_name: string;
      name: string;
      description: string | null;
      html_url: string;
      default_branch: string;
      private: boolean;
      language: string | null;
      updated_at: string;
    }> = [];

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&type=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "archon",
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch repositories from GitHub" },
          { status: response.status }
        );
      }

      const pageRepos = await response.json();
      repos.push(...pageRepos);
      hasMore = pageRepos.length === 100;
      page++;
    }

    return NextResponse.json(
      repos.map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        defaultBranch: r.default_branch,
        isPrivate: r.private,
        language: r.language,
        updatedAt: r.updated_at,
      }))
    );
  } catch (error) {
    console.error("GitHub repos fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub repositories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, fullName } = await req.json();

    if (!projectId || !fullName) {
      return NextResponse.json(
        { error: "projectId and fullName are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = project.workspace.members.some((m) => m.userId === session.user.id);
    if (!isMember && project.workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = await getGitHubAccessToken(session.user.id);
    if (!token) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "archon",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Repository not found or inaccessible" },
        { status: 404 }
      );
    }

    const repoData = await response.json();

    const existingRepo = await prisma.repository.findFirst({
      where: { projectId, fullName },
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: "Repository already imported in this project" },
        { status: 409 }
      );
    }

    const repository = await prisma.repository.create({
      data: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        url: repoData.html_url,
        provider: "GITHUB",
        defaultBranch: repoData.default_branch,
        isPrivate: repoData.private,
        projectId,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      url: repository.url,
      defaultBranch: repository.defaultBranch,
      isPrivate: repository.isPrivate,
      lastSyncedAt: repository.lastSyncedAt,
    });
  } catch (error) {
    console.error("Repository import error:", error);
    return NextResponse.json(
      { error: "Failed to import repository" },
      { status: 500 }
    );
  }
}
