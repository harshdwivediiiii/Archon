"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  GitBranch,
  Rocket,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Key,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  FileArchive,
  Play,
  RotateCcw,
  History,
  Loader2,
  RefreshCw,
  Search,
  Box,
  Cog,
  Variable,
} from "lucide-react";

interface PipelineStatus {
  status: "operational" | "degraded" | "down" | "no_workspace";
  repositories: number;
  analyses: number;
  securityFindings: number;
  uptime: number;
  lastChecked: string;
}

interface Deployment {
  id: string;
  service: string;
  version: string;
  environment: string;
  status: "success" | "failed" | "in_progress" | "rolled_back";
  timestamp: string;
  duration: string;
  triggeredBy: string;
}

interface EnvVar {
  key: string;
  value: string;
  environment: string;
}

interface BuildArtifact {
  id: string;
  name: string;
  version: string;
  size: string;
  created: string;
  status: string;
}

const mockDeployments: Deployment[] = [
  { id: "1", service: "api-gateway", version: "v2.4.1", environment: "production", status: "success", timestamp: new Date(Date.now() - 3600000).toISOString(), duration: "3m 12s", triggeredBy: "deploy-bot" },
  { id: "2", service: "auth-service", version: "v1.9.3", environment: "staging", status: "success", timestamp: new Date(Date.now() - 7200000).toISOString(), duration: "2m 45s", triggeredBy: "dev-deploy" },
  { id: "3", service: "frontend", version: "v3.1.0", environment: "production", status: "failed", timestamp: new Date(Date.now() - 10800000).toISOString(), duration: "1m 30s", triggeredBy: "deploy-bot" },
  { id: "4", service: "worker", version: "v1.2.0", environment: "production", status: "in_progress", timestamp: new Date(Date.now() - 500000).toISOString(), duration: "4m 10s", triggeredBy: "auto-scale" },
  { id: "5", service: "api-gateway", version: "v2.3.0", environment: "production", status: "rolled_back", timestamp: new Date(Date.now() - 86400000).toISOString(), duration: "2m 00s", triggeredBy: "deploy-bot" },
  { id: "6", service: "auth-service", version: "v1.9.2", environment: "production", status: "success", timestamp: new Date(Date.now() - 172800000).toISOString(), duration: "3m 05s", triggeredBy: "ci-pipeline" },
  { id: "7", service: "database-migrator", version: "v0.5.1", environment: "staging", status: "success", timestamp: new Date(Date.now() - 259200000).toISOString(), duration: "5m 20s", triggeredBy: "dev-deploy" },
];

const mockEnvVars: Record<string, EnvVar[]> = {
  production: [
    { key: "DATABASE_URL", value: "postgresql://prod-db.internal:5432/app", environment: "production" },
    { key: "REDIS_URL", value: "redis://prod-redis.internal:6379", environment: "production" },
    { key: "API_KEY", value: "sk-prod-••••••••••••", environment: "production" },
    { key: "LOG_LEVEL", value: "info", environment: "production" },
  ],
  staging: [
    { key: "DATABASE_URL", value: "postgresql://staging-db.internal:5432/app", environment: "staging" },
    { key: "REDIS_URL", value: "redis://staging-redis.internal:6379", environment: "staging" },
    { key: "API_KEY", value: "sk-staging-••••••••••••", environment: "staging" },
    { key: "LOG_LEVEL", value: "debug", environment: "staging" },
  ],
};

const mockSecrets: { id: string; name: string; maskedValue: string; created: string }[] = [
  { id: "1", name: "production/DB_PASSWORD", maskedValue: "••••••••••••", created: new Date(Date.now() - 604800000).toISOString() },
  { id: "2", name: "staging/DB_PASSWORD", maskedValue: "••••••••••••", created: new Date(Date.now() - 1209600000).toISOString() },
  { id: "3", name: "production/JWT_SECRET", maskedValue: "••••••••••••••••", created: new Date(Date.now() - 2592000000).toISOString() },
  { id: "4", name: "production/STRIPE_KEY", maskedValue: "••••••••••••", created: new Date(Date.now() - 345600000).toISOString() },
];

const mockArtifacts: BuildArtifact[] = [
  { id: "1", name: "api-gateway", version: "v2.4.1", size: "45.2 MB", created: new Date(Date.now() - 3600000).toISOString(), status: "published" },
  { id: "2", name: "auth-service", version: "v1.9.3", size: "32.8 MB", created: new Date(Date.now() - 7200000).toISOString(), status: "published" },
  { id: "3", name: "frontend", version: "v3.1.0", size: "12.4 MB", created: new Date(Date.now() - 10800000).toISOString(), status: "failed" },
  { id: "4", name: "worker", version: "v1.2.0", size: "28.1 MB", created: new Date(Date.now() - 500000).toISOString(), status: "building" },
  { id: "5", name: "cli-tool", version: "v0.8.2", size: "8.3 MB", created: new Date(Date.now() - 604800000).toISOString(), status: "published" },
];

const mockPipelineLogs = `[2026-06-27T10:30:01Z] Starting pipeline: build-and-deploy (run #1847)
[2026-06-27T10:30:02Z] Cloning repository: archon/api-gateway...
[2026-06-27T10:30:05Z] Checked out branch: main (commit a1b2c3d4)
[2026-06-27T10:30:06Z] Installing dependencies...
[2026-06-27T10:30:30Z] Dependencies installed (45 packages)
[2026-06-27T10:30:31Z] Running tests...
[2026-06-27T10:31:15Z] All 248 tests passed ✓
[2026-06-27T10:31:16Z] Building Docker image: api-gateway:v2.4.1...
[2026-06-27T10:32:45Z] Image built successfully (size: 45.2 MB)
[2026-06-27T10:32:46Z] Pushing image to registry...
[2026-06-27T10:33:10Z] Image pushed: registry.internal/archon/api-gateway:v2.4.1
[2026-06-27T10:33:11Z] Deploying to production...
[2026-06-27T10:33:45Z] Running database migrations...
[2026-06-27T10:33:50Z] Migrations completed
[2026-06-27T10:34:00Z] Health check: OK (response time: 45ms)
[2026-06-27T10:34:02Z] Rolling out canary (10%)...
[2026-06-27T10:34:30Z] Canary health: OK, scaling to 100%
[2026-06-27T10:34:45Z] Deployment complete: api-gateway:v2.4.1 → production
[2026-06-27T10:34:46Z] Pipeline finished in 4m 45s ✓`;

function pipelineColor(status: string) {
  switch (status) {
    case "success": return "success";
    case "failed": return "destructive";
    case "in_progress": return "default";
    case "rolled_back": return "warning";
    default: return "secondary";
  }
}

export function DevOpsDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const [envVars, setEnvVars] = useState<Record<string, EnvVar[]>>(mockEnvVars);
  const [secrets] = useState(mockSecrets);
  const [deployments] = useState(mockDeployments);
  const [artifacts] = useState(mockArtifacts);

  const [selectedEnv, setSelectedEnv] = useState<string>("production");
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [showAddEnvVar, setShowAddEnvVar] = useState(false);
  const [hiddenEnvKeys, setHiddenEnvKeys] = useState<Set<string>>(new Set(["API_KEY", "DATABASE_URL", "REDIS_URL"]));

  const [showSecretValue, setShowSecretValue] = useState<string | null>(null);
  const [showAddSecret, setShowAddSecret] = useState(false);
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");

  const [logsOpen, setLogsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/devops");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch DevOps status");
      }
      const data: PipelineStatus = await res.json();
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch DevOps data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleDeployAction = async (action: "deploy" | "rollback" | "restart") => {
    setActionLoading(action);
    try {
      const res = await fetch("/api/devops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to trigger ${action}`);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const addEnvVar = () => {
    if (!newEnvKey || !newEnvValue) return;
    const updated = { ...envVars };
    updated[selectedEnv] = [
      ...(updated[selectedEnv] || []),
      { key: newEnvKey, value: newEnvValue, environment: selectedEnv },
    ];
    setEnvVars(updated);
    setNewEnvKey("");
    setNewEnvValue("");
    setShowAddEnvVar(false);
  };

  const removeEnvVar = (key: string) => {
    const updated = { ...envVars };
    updated[selectedEnv] = (updated[selectedEnv] || []).filter((v) => v.key !== key);
    setEnvVars(updated);
  };

  const toggleHideEnvKey = (key: string) => {
    const next = new Set(hiddenEnvKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHiddenEnvKeys(next);
  };

  const addSecret = () => {
    if (!newSecretName || !newSecretValue) return;
    setShowAddSecret(false);
    setNewSecretName("");
    setNewSecretValue("");
  };

  const lastDeployment = deployments[0];
  const failedDeployments = deployments.filter((d) => d.status === "failed").length;
  const successRate = deployments.length > 0
    ? Math.round((deployments.filter((d) => d.status === "success").length / deployments.length) * 100)
    : 0;

  const filteredDeployments = deployments.filter((d) =>
    `${d.service} ${d.version} ${d.environment}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredArtifacts = artifacts.filter((a) =>
    `${a.name} ${a.version}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">DevOps</h1>
            <p className="text-zinc-400">CI/CD pipelines, deployments, and configuration</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Pipeline Status</p>
                  <Badge
                    variant={status?.status === "operational" ? "success" : status?.status === "degraded" ? "warning" : "destructive"}
                    className="mt-1 capitalize"
                  >
                    {status?.status || "unknown"}
                  </Badge>
                </div>
                <div className="rounded-lg bg-emerald-600/10 p-3">
                  <GitBranch className="h-5 w-5 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{successRate}%</p>
                </div>
                <div className="rounded-lg bg-blue-600/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Last Deployment</p>
                  <p className="text-sm font-medium text-white truncate max-w-[140px]">
                    {lastDeployment?.service || "N/A"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {lastDeployment ? formatDistanceToNow(new Date(lastDeployment.timestamp), { addSuffix: true }) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-600/10 p-3">
                  <Rocket className="h-5 w-5 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Failed / Total</p>
                  <p className="text-2xl font-bold text-white">
                    {failedDeployments}
                    <span className="text-sm text-zinc-500 font-normal"> / {deployments.length}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-red-600/10 p-3">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>CI/CD & Configuration</CardTitle>
              <CardDescription>Pipelines, environments, and build artifacts</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">
                  <Rocket className="mr-2 h-4 w-4" />
                  Deployments
                </TabsTrigger>
                <TabsTrigger value="env-vars">
                  <Variable className="mr-2 h-4 w-4" />
                  Environment
                </TabsTrigger>
                <TabsTrigger value="secrets">
                  <Lock className="mr-2 h-4 w-4" />
                  Secrets
                </TabsTrigger>
                <TabsTrigger value="artifacts">
                  <FileArchive className="mr-2 h-4 w-4" />
                  Artifacts
                </TabsTrigger>
                <TabsTrigger value="pipeline-logs">
                  <Terminal className="mr-2 h-4 w-4" />
                  Pipeline Logs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    size="sm"
                    onClick={() => handleDeployAction("deploy")}
                    disabled={actionLoading === "deploy"}
                  >
                    {actionLoading === "deploy" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Deploy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeployAction("rollback")}
                    disabled={actionLoading === "rollback"}
                  >
                    {actionLoading === "rollback" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <History className="mr-2 h-4 w-4" />
                    )}
                    Rollback
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeployAction("restart")}
                    disabled={actionLoading === "restart"}
                  >
                    {actionLoading === "restart" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Restart
                  </Button>
                </div>
                {filteredDeployments.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">
                    {searchQuery ? "No deployments match your search" : "No deployments yet"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Service</th>
                          <th className="pb-3 pr-4 font-medium">Version</th>
                          <th className="pb-3 pr-4 font-medium">Environment</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Duration</th>
                          <th className="pb-3 pr-4 font-medium">Triggered By</th>
                          <th className="pb-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeployments.map((d) => (
                          <tr key={d.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                            <td className="py-3 pr-4">
                              <span className="text-white font-medium">{d.service}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant="outline" className="font-mono text-xs">{d.version}</Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={d.environment === "production" ? "default" : "secondary"}>
                                {d.environment}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant={pipelineColor(d.status)} className="capitalize">
                                {d.status === "in_progress" ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : null}
                                {d.status.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-zinc-300">{d.duration}</td>
                            <td className="py-3 pr-4 text-zinc-400">{d.triggeredBy}</td>
                            <td className="py-3 text-zinc-400 text-xs">
                              {formatDistanceToNow(new Date(d.timestamp), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="env-vars">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {Object.keys(envVars).map((env) => (
                    <Button
                      key={env}
                      variant={selectedEnv === env ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEnv(env)}
                    >
                      <Box className="mr-2 h-4 w-4" />
                      {env}
                    </Button>
                  ))}
                  <div className="flex-1" />
                  <Button size="sm" onClick={() => setShowAddEnvVar(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variable
                  </Button>
                </div>
                {(envVars[selectedEnv] || []).length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">
                    No environment variables for <span className="font-medium text-zinc-300">{selectedEnv}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(envVars[selectedEnv] || []).map((envVar) => (
                      <div
                        key={envVar.key}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Cog className="h-4 w-4 text-zinc-500 shrink-0" />
                          <span className="text-sm font-medium text-white font-mono">{envVar.key}</span>
                          <span className="text-sm text-zinc-500">=</span>
                          <span className="text-sm text-zinc-400 font-mono truncate">
                            {hiddenEnvKeys.has(envVar.key) ? "••••••••••••••••" : envVar.value}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-zinc-200"
                            onClick={() => toggleHideEnvKey(envVar.key)}
                          >
                            {hiddenEnvKeys.has(envVar.key) ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-red-400"
                            onClick={() => removeEnvVar(envVar.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Dialog open={showAddEnvVar} onOpenChange={setShowAddEnvVar}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Environment Variable</DialogTitle>
                      <DialogDescription>
                        Add a new variable for {selectedEnv}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className="text-sm text-zinc-400 mb-1 block">Key</label>
                        <Input
                          placeholder="e.g. MY_VARIABLE"
                          value={newEnvKey}
                          onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-1 block">Value</label>
                        <Input
                          placeholder="e.g. my-value"
                          value={newEnvValue}
                          onChange={(e) => setNewEnvValue(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddEnvVar(false)}>Cancel</Button>
                      <Button onClick={addEnvVar}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="secrets">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-400">Stored secrets are masked for security</p>
                  <Button size="sm" onClick={() => setShowAddSecret(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Secret
                  </Button>
                </div>
                {secrets.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">No secrets stored</div>
                ) : (
                  <div className="space-y-2">
                    {secrets.map((secret) => (
                      <div
                        key={secret.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Key className="h-4 w-4 text-amber-400" />
                          <span className="text-sm font-medium text-white font-mono">{secret.name}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {showSecretValue === secret.id ? "my-secret-value" : secret.maskedValue}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-zinc-200"
                            onClick={() => setShowSecretValue(showSecretValue === secret.id ? null : secret.id)}
                          >
                            {showSecretValue === secret.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Dialog open={showAddSecret} onOpenChange={setShowAddSecret}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Secret</DialogTitle>
                      <DialogDescription>Store a new secret value securely</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className="text-sm text-zinc-400 mb-1 block">Secret Name</label>
                        <Input
                          placeholder="e.g. production/API_SECRET"
                          value={newSecretName}
                          onChange={(e) => setNewSecretName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-1 block">Secret Value</label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={newSecretValue}
                          onChange={(e) => setNewSecretValue(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddSecret(false)}>Cancel</Button>
                      <Button onClick={addSecret}>Save Secret</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="artifacts">
                {filteredArtifacts.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">
                    {searchQuery ? "No artifacts match your search" : "No build artifacts"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Name</th>
                          <th className="pb-3 pr-4 font-medium">Version</th>
                          <th className="pb-3 pr-4 font-medium">Size</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 font-medium">Built</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArtifacts.map((a) => (
                          <tr key={a.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <FileArchive className="h-4 w-4 text-zinc-500" />
                                <span className="text-white font-medium">{a.name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant="outline" className="font-mono text-xs">{a.version}</Badge>
                            </td>
                            <td className="py-3 pr-4 text-zinc-300">{a.size}</td>
                            <td className="py-3 pr-4">
                              <Badge variant={a.status === "published" ? "success" : a.status === "failed" ? "destructive" : "default"} className="capitalize">
                                {a.status === "building" && (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                )}
                                {a.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-zinc-400 text-xs">
                              {formatDistanceToNow(new Date(a.created), { addSuffix: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pipeline-logs">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-400">Latest pipeline execution logs</p>
                  <Button size="sm" variant="outline" onClick={() => setLogsOpen(true)}>
                    <Terminal className="mr-2 h-4 w-4" />
                    View Full Logs
                  </Button>
                </div>
                <ScrollArea className="h-[400px] w-full rounded-lg border border-zinc-800 bg-black/50 p-4">
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {mockPipelineLogs}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              Pipeline Logs (Full)
            </DialogTitle>
            <DialogDescription>Complete build and deploy log output</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] w-full rounded-lg border border-zinc-800 bg-black/50 p-4">
            <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
              {mockPipelineLogs}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
