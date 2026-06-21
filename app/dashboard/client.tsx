"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BookOpen,
  GitBranch,
  Layers,
  Network,
  Plus,
  Server,
  Loader2,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  repoCount: number;
  diagramCount: number;
  updatedAt: string;
}

interface ImportedRepo {
  id: string;
  fullName: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
}

export function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<ImportedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, repos: 0, diagrams: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok || cancelled) return;
        const data: Project[] = await res.json();

        let repoCount = 0;
        for (const p of data) {
          if (cancelled) break;
          const pRes = await fetch(`/api/projects/${p.id}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            repoCount += pData.repositories?.length ?? 0;
          }
        }

        if (!cancelled) {
          setProjects(data);
          setRepos([]);
          setStats({
            projects: data.length,
            repos: repoCount,
            diagrams: data.reduce((a: number, p: Project) => a + p.diagramCount, 0),
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">Welcome back to Archon</p>
          </div>
          <Link href="/dashboard/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Projects</p>
                    <p className="text-2xl font-bold text-white">{stats.projects}</p>
                  </div>
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <Layers className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Repositories</p>
                    <p className="text-2xl font-bold text-white">{stats.repos}</p>
                  </div>
                  <div className="rounded-lg bg-purple-600/10 p-3">
                    <GitBranch className="h-5 w-5 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Diagrams</p>
                    <p className="text-2xl font-bold text-white">{stats.diagrams}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-600/10 p-3">
                    <Network className="h-5 w-5 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Team Members</p>
                    <p className="text-2xl font-bold text-white">1</p>
                  </div>
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-400" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>Your recently updated projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-zinc-500">No projects yet</p>
                      <Link href="/dashboard/projects">
                        <Button variant="link" className="mt-2">
                          Create your first project
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <Link key={project.id} href="/dashboard/architecture">
                        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-600/10 p-2">
                              <Server className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{project.name}</p>
                              <p className="text-xs text-zinc-500">
                                {project.repoCount} repos · {project.diagramCount} diagrams
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitHubIcon className="h-5 w-5 text-purple-400" />
                    Connected Repositories
                  </CardTitle>
                  <CardDescription>Your GitHub repositories being analyzed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {repos.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-zinc-500">No repositories connected</p>
                      <Link href="/dashboard/repositories">
                        <Button variant="link" className="mt-2">
                          Connect a repository
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    repos.slice(0, 5).map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-purple-600/10 p-2">
                            <BookOpen className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{repo.fullName}</p>
                            <p className="text-xs text-zinc-500">{repo.defaultBranch}</p>
                          </div>
                        </div>
                        <Badge variant={repo.lastSyncedAt ? "success" : "warning"} className="capitalize">
                          {repo.lastSyncedAt ? "synced" : "pending"}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
