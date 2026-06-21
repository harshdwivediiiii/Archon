"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, RefreshCw, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  language: string | null;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface ImportedRepo {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  lastSyncedAt: string | null;
  language?: string | null;
}

export default function RepositoriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepo[]>([]);
  const [importedRepos, setImportedRepos] = useState<ImportedRepo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchImportedRepos()]);
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch {
      // ignore
    }
  }

  async function fetchImportedRepos() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const projs: Project[] = await res.json();
        setProjects(projs);
        const allRepos: ImportedRepo[] = [];
        for (const p of projs) {
          const pRes = await fetch(`/api/projects/${p.id}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData.repositories) allRepos.push(...pData.repositories);
          }
        }
        setImportedRepos(allRepos);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchGitHubRepos() {
    setError(null);
    try {
      const res = await fetch("/api/github/repositories");
      if (res.ok) {
        const data = await res.json();
        setGitHubRepos(data);
        if (data.length === 0) {
          setError("No GitHub repositories found. Make sure your GitHub account has repositories.");
        }
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Failed to fetch GitHub repositories");
      }
    } catch {
      setError("Failed to connect to GitHub");
    }
  }

  async function handleImport() {
    if (!selectedRepo || !selectedProject) return;
    setImporting(true);
    try {
      const res = await fetch("/api/github/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject, fullName: selectedRepo }),
      });
      if (res.ok) {
        setConnectOpen(false);
        setSelectedRepo(null);
        setSelectedProject(null);
        await fetchImportedRepos();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Failed to import repository");
      }
    } catch {
      setError("Failed to import repository");
    } finally {
      setImporting(false);
    }
  }

  async function handleSync(repoId: string) {
    setSyncingId(repoId);
    try {
      await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId }),
      });
      await fetchImportedRepos();
    } catch {
      // ignore
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Repositories</h1>
            <p className="text-zinc-400">Connect and manage your GitHub repositories</p>
          </div>
          <Button
            onClick={() => {
              fetchGitHubRepos();
              setConnectOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect Repository
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        )}

        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitHubIcon className="h-5 w-5 text-purple-400" />
                Connected Repositories
              </CardTitle>
              <CardDescription>Repositories being analyzed by Archon</CardDescription>
            </CardHeader>
            <CardContent>
              {importedRepos.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <GitBranch className="mb-4 h-12 w-12 text-zinc-600" />
                  <h3 className="mb-2 text-lg font-semibold text-white">No repositories connected</h3>
                  <p className="mb-6 text-sm text-zinc-400">
                    Connect a GitHub repository to start analyzing your architecture
                  </p>
                  <Button
                    onClick={() => {
                      fetchGitHubRepos();
                      setConnectOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Repository
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {importedRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-purple-600/10 p-2">
                          <BookOpen className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{repo.fullName}</p>
                            <Badge variant="outline" className="text-xs">
                              {repo.language || "N/A"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" /> {repo.defaultBranch}
                            </span>
                            <span>
                              {repo.lastSyncedAt
                                ? `Last synced: ${new Date(repo.lastSyncedAt).toLocaleDateString()}`
                                : "Not synced yet"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={repo.lastSyncedAt ? "success" : "warning"} className="capitalize">
                          {repo.lastSyncedAt ? "synced" : "pending"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSync(repo.id)}
                          disabled={syncingId === repo.id}
                        >
                          <RefreshCw className={`h-4 w-4 ${syncingId === repo.id ? "animate-spin" : ""}`} />
                        </Button>
                        <a href={repo.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Repository</DialogTitle>
            <DialogDescription>Import a GitHub repository for architecture analysis</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Project</label>
              <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Repository</label>
              <Select value={selectedRepo || ""} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder={gitHubRepos.length > 0 ? "Select a repository" : "Loading repositories..."} />
                </SelectTrigger>
                <SelectContent>
                  {gitHubRepos.map((r) => (
                    <SelectItem key={r.id} value={r.fullName}>
                      {r.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRepo && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="text-xs text-zinc-400">
                  This will import the repository and run AI analysis to generate architecture diagrams and knowledge graphs.
                </p>
              </div>
            )}
            {gitHubRepos.length === 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                No repositories found. Make sure your GitHub account has repositories and you&apos;re signed in with GitHub.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedRepo || !selectedProject || importing}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import Repository
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
