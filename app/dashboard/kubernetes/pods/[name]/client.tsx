"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Container,
  Cpu,
  HardDrive,
  Activity,
  FileText,
  Terminal,
  Clock,
  Server,
  Network,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ContainerInfo {
  name: string;
  image: string;
  ready: boolean;
  started: boolean;
  state: string;
  stateReason: string;
  restartCount: number;
}

interface PodCondition {
  type: string;
  status: string;
  reason: string;
  message: string;
}

interface PodDetail {
  name: string;
  namespace: string;
  status: string;
  node: string;
  ip: string;
  hostIP: string;
  restarts: number;
  age: string;
  qosClass: string;
  serviceAccount: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  containers: ContainerInfo[];
  conditions: PodCondition[];
  yaml: string;
}

interface EventSummary {
  name: string;
  namespace: string;
  kind: string;
  involvedObject: string;
  type: string;
  reason: string;
  message: string;
  source: string;
  count: number;
  firstTimestamp: string;
  lastTimestamp: string;
  age: string;
}

interface ResourceMetrics {
  name: string;
  namespace?: string;
  cpu: string;
  memory: string;
  cpuValue: number;
  memoryValue: number;
}

function PodStatusBadge({ status }: { status: string }) {
  const variant = status === "Running"
    ? "success" as const
    : status === "Pending" || status === "ContainerCreating"
      ? "warning" as const
      : "destructive" as const;
  return <Badge variant={variant}>{status}</Badge>;
}

function ContainerStateBadge({ state, reason }: { state: string; reason: string }) {
  const variant = state === "Running"
    ? "success" as const
    : state === "Waiting"
      ? "warning" as const
      : "destructive" as const;
  return <Badge variant={variant}>{reason || state}</Badge>;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Card className="border-[#414754] bg-[#1c1f27]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-[#e0e2ed]">
          <Icon className="h-4 w-4 text-[#0070f3]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function PodDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const podName = params?.name as string;
  const namespace = searchParams?.get("namespace") ?? "default";

  const [pod, setPod] = useState<PodDetail | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [metrics, setMetrics] = useState<ResourceMetrics | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [yamlExpanded, setYamlExpanded] = useState(false);

  const fetchPod = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [podRes, eventsRes, metricsRes] = await Promise.all([
        fetch(`/api/kubernetes/pods/${encodeURIComponent(podName)}?namespace=${encodeURIComponent(namespace)}`),
        fetch(`/api/kubernetes/events?namespace=${encodeURIComponent(namespace)}`),
        fetch(`/api/kubernetes/metrics`),
      ]);

      if (!podRes.ok) {
        const errData = await podRes.json().catch(() => ({ error: podRes.statusText }));
        throw new Error(errData.error || "Failed to load pod");
      }

      const podData: PodDetail = await podRes.json();
      setPod(podData);

      if (eventsRes.ok) {
        const eventsData: EventSummary[] = await eventsRes.json();
        setEvents(eventsData.filter((e) => e.involvedObject === podName));
      }

      if (metricsRes.ok) {
        const metricsData: { pods: ResourceMetrics[] } = await metricsRes.json();
        const podMetric = metricsData.pods.find((m) => m.name === podName);
        if (podMetric) setMetrics(podMetric);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [podName, namespace]);

  const fetchLogs = useCallback(async (container?: string) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const params = new URLSearchParams({ namespace });
      if (container) params.set("container", container);
      params.set("tailLines", "100");
      const res = await fetch(`/api/kubernetes/pods/${encodeURIComponent(podName)}/logs?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || "Failed to load logs");
      }
      const data = await res.json();
      setLogs(data.logs ?? "No logs available");
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  }, [podName, namespace]);

  useEffect(() => {
    fetchPod();
  }, [fetchPod]);

  const copyYaml = async () => {
    if (pod) {
      await navigator.clipboard.writeText(pod.yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/kubernetes" className="text-[#c1c6d7] hover:text-[#e0e2ed] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl border border-[#414754]" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl border border-[#414754]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-lg text-red-400 mb-2">Failed to load pod</p>
          <p className="text-sm text-[#c1c6d7] mb-6 max-w-md">{error}</p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/kubernetes"
              className="flex items-center gap-2 rounded-lg border border-[#414754] px-4 py-2 text-sm text-[#e0e2ed] hover:bg-[#272a32] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <button
              onClick={fetchPod}
              className="flex items-center gap-2 rounded-lg bg-[#0070f3] px-4 py-2 text-sm text-white hover:bg-[#0070f3]/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!pod) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/kubernetes" className="text-[#c1c6d7] hover:text-[#e0e2ed] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[#e0e2ed]">{pod.name}</h1>
                <PodStatusBadge status={pod.status} />
              </div>
              <p className="text-sm text-[#c1c6d7]">
                Namespace: {pod.namespace}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPod}
              className="flex items-center gap-2 rounded-lg border border-[#414754] px-3 py-1.5 text-sm text-[#e0e2ed] hover:bg-[#272a32] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-[#414754] bg-[#1c1f27]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-600/10 p-2">
                <Server className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[#c1c6d7]">Node</p>
                <p className="text-sm font-medium text-[#e0e2ed]">{pod.node || "-"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#414754] bg-[#1c1f27]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-600/10 p-2">
                <Network className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[#c1c6d7]">Pod IP</p>
                <p className="text-sm font-medium text-[#e0e2ed] font-mono">{pod.ip || "-"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#414754] bg-[#1c1f27]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-amber-600/10 p-2">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-[#c1c6d7]">Age</p>
                <p className="text-sm font-medium text-[#e0e2ed]">{pod.age}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#414754] bg-[#1c1f27]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-purple-600/10 p-2">
                <Activity className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-[#c1c6d7]">Restarts</p>
                <p className={`text-sm font-medium ${pod.restarts > 0 ? "text-amber-400" : "text-[#e0e2ed]"}`}>
                  {pod.restarts}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Containers" icon={Container}>
            <div className="space-y-3">
              {pod.containers.map((c) => (
                <div key={c.name} className="rounded-lg border border-[#414754] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${c.ready ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="text-sm font-medium text-[#e0e2ed]">{c.name}</span>
                    </div>
                    <ContainerStateBadge state={c.state} reason={c.stateReason} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#c1c6d7]">
                    <span className="truncate max-w-[250px]" title={c.image}>{c.image}</span>
                    <span>Restarts: {c.restartCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Resource Usage" icon={Cpu}>
            {metrics ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#c1c6d7]">CPU</span>
                    <span className="text-[#e0e2ed] font-mono">{metrics.cpu}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#272a32] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min((metrics.cpuValue / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#c1c6d7]">Memory</span>
                    <span className="text-[#e0e2ed] font-mono">{metrics.memory}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#272a32] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min((metrics.memoryValue / (2 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-4 text-sm text-[#c1c6d7]">
                <AlertCircle className="h-4 w-4" />
                Metrics not available
              </div>
            )}
          </Section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Conditions" icon={Activity}>
            {pod.conditions.length === 0 ? (
              <p className="text-sm text-[#c1c6d7]">No conditions</p>
            ) : (
              <div className="space-y-2">
                {pod.conditions.map((cond) => (
                  <div key={cond.type} className="flex items-center justify-between rounded-lg border border-[#414754] p-3">
                    <div>
                      <p className="text-sm font-medium text-[#e0e2ed]">{cond.type}</p>
                      {cond.message && (
                        <p className="text-xs text-[#c1c6d7] mt-0.5">{cond.message}</p>
                      )}
                    </div>
                    <Badge variant={cond.status === "True" ? "success" : cond.status === "False" ? "destructive" : "warning"}>
                      {cond.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Events" icon={Clock}>
            {events.length === 0 ? (
              <p className="text-sm text-[#c1c6d7]">No events</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {events.slice().reverse().map((evt) => (
                  <div key={evt.name} className="rounded-lg border border-[#414754] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={evt.type === "Normal" ? "success" : "destructive"} className="text-xs">
                          {evt.reason}
                        </Badge>
                      </div>
                      <span className="text-xs text-[#c1c6d7]">{evt.age}</span>
                    </div>
                    <p className="text-xs text-[#c1c6d7]">{evt.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <Section title="Logs" icon={Terminal}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => fetchLogs(e.target.value || undefined)}
                className="rounded-lg border border-[#414754] bg-[#1c1f27] px-3 py-1.5 text-xs text-[#e0e2ed] focus:outline-none focus:ring-1 focus:ring-[#0070f3]"
              >
                <option value="">All containers</option>
                {pod.containers.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => fetchLogs()}
                className="rounded-lg border border-[#414754] px-3 py-1.5 text-xs text-[#c1c6d7] hover:bg-[#272a32] transition-colors"
              >
                Load Logs
              </button>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#c1c6d7]" />
              </div>
            ) : logsError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {logsError}
              </div>
            ) : logs ? (
              <pre className="max-h-80 overflow-auto rounded-lg bg-[#10131b] p-4 text-xs leading-relaxed text-[#c1c6d7] font-mono whitespace-pre-wrap">
                {logs}
              </pre>
            ) : (
              <p className="text-sm text-[#c1c6d7]">Click "Load Logs" to fetch pod logs</p>
            )}
          </div>
        </Section>

        <Section title="YAML" icon={FileText}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setYamlExpanded(!yamlExpanded)}
                className="rounded-lg border border-[#414754] px-3 py-1.5 text-xs text-[#c1c6d7] hover:bg-[#272a32] transition-colors"
              >
                {yamlExpanded ? "Collapse" : "Expand"}
              </button>
              <button
                onClick={copyYaml}
                className="flex items-center gap-1 rounded-lg border border-[#414754] px-3 py-1.5 text-xs text-[#c1c6d7] hover:bg-[#272a32] transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre
              className={`overflow-auto rounded-lg bg-[#10131b] p-4 text-xs leading-relaxed text-[#c1c6d7] font-mono ${
                yamlExpanded ? "max-h-[600px]" : "max-h-48"
              }`}
            >
              {pod.yaml}
            </pre>
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
