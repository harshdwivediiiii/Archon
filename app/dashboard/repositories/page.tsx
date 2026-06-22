"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Terminal,
  GitMerge,
  Code2,
  Server,
  Lightbulb,
  RefreshCw,
  Share2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Plus,
  Loader2,
  GitBranch,
  Globe,
  Database,
  Package,
  Box,
  FileJson,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

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
  projectId: string;
  projectName: string;
}

interface AnalysisProgress {
  analysisId: string;
  stage: string;
  progress: number;
  status: string;
  error?: string;
}

interface AnalysisResult {
  analysis: {
    status: string;
    stage: string;
    progress: number;
    services: unknown[];
    apis: unknown[];
    databases: unknown[];
    dependencies: unknown[];
    infra: unknown[];
    modules: unknown[];
    files: unknown[];
  };
  diagrams: Array<{
    id: string;
    name: string;
    nodes: unknown[];
    edges: unknown[];
  }>;
  documents: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

const STAGE_LABELS: Record<string, string> = {
  pending: "Waiting to start...",
  cloning: "Cloning repository...",
  analyzing: "Analyzing source code...",
  graph: "Building knowledge graph...",
  diagrams: "Generating architecture diagrams...",
  docs: "Generating documentation...",
  completed: "Analysis complete!",
  failed: "Analysis failed",
};

const STAGE_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  cloning: GitBranch,
  analyzing: Code2,
  graph: GitMerge,
  diagrams: Box,
  docs: FileJson,
  completed: CheckCircle2,
  failed: XCircle,
};

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
  const [analysisProgress, setAnalysisProgress] = useState<Record<string, AnalysisProgress>>({});
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const progressRef = useRef<Record<string, EventSource>>({});

  useEffect(() => {
    const ref = progressRef.current;
    Promise.all([fetchProjects(), fetchImportedRepos()]);
    return () => {
      Object.values(ref).forEach((es) => es.close());
    };
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
      const res = await fetch("/api/repositories");
      if (res.ok) {
        setImportedRepos(await res.json());
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
        const repo = await res.json();
        setConnectOpen(false);
        setSelectedRepo(null);
        setSelectedProject(null);
        await fetchImportedRepos();
        await handleSync(repo.id || repo.repositoryId);
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
    setAnalysisProgress((prev) => ({
      ...prev,
      [repoId]: { analysisId: repoId, stage: "pending", progress: 0, status: "PENDING" },
    }));

    try {
      const es = new EventSource(`/api/analysis/progress/${repoId}`);
      progressRef.current[repoId] = es;

      es.onmessage = (event) => {
        try {
          const progress: AnalysisProgress = JSON.parse(event.data);
          setAnalysisProgress((prev) => ({ ...prev, [repoId]: progress }));

          if (progress.status === "COMPLETED") {
            es.close();
            delete progressRef.current[repoId];
            fetchAnalysisResults(repoId);
            fetchImportedRepos();
            setSyncingId(null);
          } else if (progress.status === "FAILED") {
            es.close();
            delete progressRef.current[repoId];
            setSyncingId(null);
            setError(progress.error || "Analysis failed");
          }
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        delete progressRef.current[repoId];
        setSyncingId(null);
      };

      const syncRes = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId }),
      });

      if (!syncRes.ok) {
        es.close();
        delete progressRef.current[repoId];
        const errorBody = await syncRes.json().catch(() => ({ error: "Sync failed" }));
        throw new Error(errorBody.error || `Sync failed with status ${syncRes.status}`);
      }
    } catch (err) {
      setSyncingId(null);
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    }
  }

  async function fetchAnalysisResults(repoId: string) {
    try {
      const res = await fetch(`/api/analysis/results/${repoId}`);
      if (res.ok) {
        const data: AnalysisResult = await res.json();
        setAnalysisResults((prev) => ({ ...prev, [repoId]: data }));
      }
    } catch {
      // ignore
    }
  }

  function formatTimeAgo(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  }

  const getProgress = (repoId: string) => analysisProgress[repoId];
  const getResult = (repoId: string) => analysisResults[repoId];

  const StageIcon = ({ stage }: { stage: string }) => {
    const Icon = STAGE_ICONS[stage] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Context Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-zinc-500 uppercase">
              <Terminal className="h-3.5 w-3.5" />
              Repository Context
            </div>
            <h3 className="text-2xl font-semibold text-white md:text-3xl">
              {importedRepos.length > 0 ? importedRepos[0].fullName : "Repository Intelligence"}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
              {importedRepos.length > 0 && (
                <>
                  <Badge variant="outline" className="flex items-center gap-1 border-zinc-700 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    <GitBranch className="h-3 w-3" />
                    {importedRepos[0].defaultBranch}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <RefreshCw className="h-3 w-3" />
                    Last sync {formatTimeAgo(importedRepos[0].lastSyncedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              className="bg-primary-container text-primary-foreground hover:bg-primary-container/90"
              onClick={() => {
                if (importedRepos.length > 0) handleSync(importedRepos[0].id);
              }}
              disabled={syncingId !== null}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncingId !== null ? "animate-spin" : ""}`} />
              Rescan Repo
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Export Graph
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* LEFT COLUMN */}
            <div className="space-y-6 md:col-span-8">
              {/* Knowledge Graph Node Canvas */}
              <div className="glass-panel relative min-h-[460px] overflow-hidden rounded-xl">
                <div className="absolute inset-0 graph-canvas" />

                {/* SVG connection lines */}
                <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
                  <line x1="50%" y1="35%" x2="25%" y2="25%" stroke="#414754" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="35%" x2="75%" y2="25%" stroke="#414754" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="35%" x2="50%" y2="60%" stroke="#414754" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>

                {/* Central node */}
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
                  <div className="node-pulse relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary-container bg-zinc-900">
                    <GitMerge className="h-10 w-10 text-primary" />
                  </div>
                  <p className="mt-2 text-center text-xs font-medium text-zinc-300">
                    {importedRepos.length > 0 ? importedRepos[0].fullName : "No Repository"}
                  </p>
                </div>

                {/* Service nodes -- generated from analysis */}
                {importedRepos.map((repo) => {
                  const result = getResult(repo.id);
                  const services = (result?.analysis?.services || []) as Array<{
                    name: string;
                    type: string;
                    technology: string;
                  }>;
                  if (services.length === 0) return null;

                  const positions = [
                    { left: "25%", top: "25%" },
                    { left: "75%", top: "25%" },
                    { left: "50%", top: "60%" },
                    { left: "15%", top: "55%" },
                    { left: "85%", top: "55%" },
                  ];

                  return services.slice(0, 5).map((svc, i) => (
                    <div
                      key={svc.name}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: positions[i]?.left || "50%", top: positions[i]?.top || "50%" }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 transition-colors hover:border-primary-container cursor-pointer">
                        {svc.type === "frontend" ? (
                          <Code2 className="h-5 w-5 text-zinc-400" />
                        ) : svc.type === "backend" ? (
                          <Server className="h-5 w-5 text-zinc-400" />
                        ) : (
                          <Database className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <p className="mt-1 text-center text-[10px] text-zinc-500 max-w-20 truncate">{svc.name}</p>
                    </div>
                  ));
                })}

                {/* HUD overlay */}
                <div className="absolute left-3 top-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-semibold tracking-wide text-green-400">
                      {importedRepos.length > 0 ? "SYSTEM ACTIVE" : "NO DATA"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1">
                    <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
                    <span className="text-[10px] font-semibold tracking-wide text-orange-400">
                      {importedRepos.length} REPOSITORIES
                    </span>
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-black/60 p-1">
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                    <Crosshair className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Detected Services List */}
              <div className="glass-panel rounded-xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Detected Services</h4>
                  <Badge variant="outline" className="border-zinc-700 text-xs text-zinc-400">
                    {importedRepos.length} REPOSITORIES
                  </Badge>
                </div>

                <div className="space-y-2">
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
                    importedRepos.map((repo) => {
                      const progress = getProgress(repo.id);
                      const result = getResult(repo.id);
                      const isSyncing = syncingId === repo.id;
                      const services = (result?.analysis?.services || []) as Array<{
                        name: string;
                        type: string;
                        technology: string;
                        description: string;
                        port?: number;
                        databases: string[];
                        envVars: string[];
                      }>;
                      const apis = (result?.analysis?.apis || []) as Array<{
                        method: string;
                        path: string;
                        type: string;
                      }>;
                      const databases = (result?.analysis?.databases || []) as Array<{
                        type: string;
                        name?: string;
                      }>;
                      const infra = (result?.analysis?.infra || []) as Array<{
                        type: string;
                        name: string;
                      }>;

                      return (
                        <div key={repo.id}>
                          {/* Progress bar */}
                          {isSyncing && progress && (
                            <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <StageIcon stage={progress.stage} />
                                  <span className="text-xs font-medium text-zinc-300">
                                    {STAGE_LABELS[progress.stage] || progress.stage}
                                  </span>
                                </div>
                                <span className="text-xs font-mono text-zinc-500">{progress.progress}%</span>
                              </div>
                              <Progress value={progress.progress} className="h-1.5" />
                            </div>
                          )}

                          {/* Repo row */}
                          <div className="group flex items-center gap-4 rounded-lg border border-zinc-800 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/40">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 transition-transform group-hover:scale-110">
                              <Server className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{repo.fullName}</span>
                                {isSyncing ? (
                                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-400 animate-pulse">
                                    Analyzing...
                                  </Badge>
                                ) : repo.lastSyncedAt ? (
                                  <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-[10px] text-green-400">
                                    Synced
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-xs text-zinc-500">
                                {repo.description || `Repository: ${repo.fullName}`}
                              </p>
                              {result && services.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {services.slice(0, 4).map((svc) => (
                                    <Badge key={svc.name} variant="outline" className="border-zinc-700 text-[10px] text-zinc-400">
                                      {svc.technology}: {svc.name}
                                    </Badge>
                                  ))}
                                  {services.length > 4 && (
                                    <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-400">
                                      +{services.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSync(repo.id)}
                                disabled={isSyncing}
                              >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                              </Button>
                            </div>
                          </div>

                          {/* Analysis result cards */}
                          {result && !isSyncing && (
                            <div className="mt-2 grid grid-cols-2 gap-2 pl-14">
                              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <Server className="h-3 w-3" />
                                  Services
                                </div>
                                <p className="mt-1 text-sm font-semibold text-white">{services.length}</p>
                              </div>
                              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <Globe className="h-3 w-3" />
                                  APIs
                                </div>
                                <p className="mt-1 text-sm font-semibold text-white">{apis.length}</p>
                              </div>
                              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <Database className="h-3 w-3" />
                                  Databases
                                </div>
                                <p className="mt-1 text-sm font-semibold text-white">{databases.length}</p>
                              </div>
                              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <Package className="h-3 w-3" />
                                  Infra Resources
                                </div>
                                <p className="mt-1 text-sm font-semibold text-white">{infra.length}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 md:col-span-4">
              {/* AI Mentor Mode Card */}
              <div className="glass-panel shimmer-ai relative overflow-hidden rounded-xl border-0 p-5">
                <div className="relative z-10">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
                      <GitMerge className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">AI Mentor Mode</h4>
                  </div>

                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-zinc-400">Architecture Insights</p>
                    {importedRepos.length > 0 ? (
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {importedRepos.length} repositor{importedRepos.length > 1 ? "ies" : "y"} connected.
                        {importedRepos.some((r) => getResult(r.id))
                          ? " Analysis available for reviewed repositories."
                          : " Sync a repository to get detailed architecture insights."}
                      </p>
                    ) : (
                      <p className="text-sm leading-relaxed text-zinc-300">
                        Connect a repository to get AI-powered architecture analysis and insights.
                      </p>
                    )}
                  </div>

                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-500/10 p-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <p className="text-xs leading-relaxed text-zinc-300">
                      Import a repository with Docker or Kubernetes configs to see infrastructure analysis.
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      fetchGitHubRepos();
                      setConnectOpen(true);
                    }}
                  >
                    Ask Mentor a question
                  </Button>
                </div>
              </div>

              {/* API Relationship Map */}
              <div className="glass-panel rounded-xl p-5">
                <h4 className="mb-4 text-sm font-semibold text-white">API Relationship Map</h4>
                {importedRepos.length > 0 ? (
                  (() => {
                    const allApis = importedRepos
                      .map((r) => getResult(r.id))
                      .filter(Boolean)
                      .flatMap((r) => (r!.analysis?.apis || []) as Array<{ method: string; type: string }>);
                    const allDbs = importedRepos
                      .map((r) => getResult(r.id))
                      .filter(Boolean)
                      .flatMap((r) => (r!.analysis?.databases || []) as Array<{ type: string }>);
                    const restCount = allApis.filter((a) => a.type === "rest").length;
                    const graphqlCount = allApis.filter((a) => a.type === "graphql").length;
                    const wsCount = allApis.filter((a) => a.type === "websocket").length;
                    const dbTypes = [...new Set(allDbs.map((d) => d.type))];

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">REST Endpoints</span>
                          <span className="text-sm font-semibold text-white">{restCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">GraphQL Resolvers</span>
                          <span className="text-sm font-semibold text-white">{graphqlCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">WebSocket</span>
                          <span className="text-sm font-semibold text-white">{wsCount || 0}</span>
                        </div>
                        {dbTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {dbTypes.map((t) => (
                              <Badge key={t} variant="outline" className="border-zinc-700 text-[10px] text-zinc-400">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="pt-2">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-zinc-400">System Health</span>
                            <span className="text-xs font-semibold text-green-400">
                              {importedRepos.some((r) => getResult(r.id)) ? "Active" : "N/A"}
                            </span>
                          </div>
                          <Progress
                            value={importedRepos.some((r) => getResult(r.id)) ? 100 : 0}
                            className="h-2"
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-500">No data yet. Import a repository to see API relationships.</p>
                  </div>
                )}
              </div>

              {/* Stats / Documents */}
              {importedRepos.some((r) => getResult(r.id)) && (
                <div className="glass-panel rounded-xl p-5">
                  <h4 className="mb-3 text-sm font-semibold text-white">Generated Documents</h4>
                  <div className="space-y-2">
                    {importedRepos.map((repo) => {
                      const result = getResult(repo.id);
                      if (!result) return null;
                      return result.documents.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="rounded-lg border border-zinc-800 p-3">
                          <p className="text-xs font-medium text-zinc-300 truncate">{doc.title}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">
                            {doc.content ? `${doc.content.substring(0, 100)}...` : "No content"}
                          </p>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-zinc-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-400">ARCHON</span>
              <span>&copy; {new Date().getFullYear()} Archon Labs</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <a href="#" className="transition-colors hover:text-zinc-300">Documentation</a>
              <a href="#" className="transition-colors hover:text-zinc-300">API Reference</a>
              <a href="#" className="transition-colors hover:text-zinc-300">Status</a>
              <a href="#" className="transition-colors hover:text-zinc-300">Security</a>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary-foreground shadow-lg transition-transform hover:scale-110"
        onClick={() => {
          fetchGitHubRepos();
          setConnectOpen(true);
        }}
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Import Dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Repository</DialogTitle>
            <DialogDescription>
              Import a GitHub repository for real architecture analysis
            </DialogDescription>
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
                  This will clone the repository and run a full static analysis to detect services, APIs, databases,
                  infrastructure, and generate architecture diagrams and documentation.
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
