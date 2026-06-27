"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Container,
  Layers,
  Network,
  Globe,
  FileJson,
  KeyRound,
  Activity,
  BarChart3,
  ArrowLeftRight,
  Box,
  Cpu,
  HardDrive,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface NamespaceSummary {
  name: string;
  status?: string;
}

interface PodSummary {
  name: string;
  namespace: string;
  status: string;
  node: string;
  ip: string;
  restarts: number;
  age: string;
  containers: { name: string; image: string; ready: boolean }[];
}

interface DeploymentSummary {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  strategy: string;
  age: string;
  conditions: { type: string; status: string; reason: string; message: string }[];
}

interface ServiceSummary {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: { name: string; protocol: string; port: number; targetPort: string; nodePort: string }[];
  age: string;
}

interface IngressSummary {
  name: string;
  namespace: string;
  className: string;
  hosts: string[];
  tls: boolean;
  age: string;
}

interface ConfigMapSummary {
  name: string;
  namespace: string;
  data: number;
  binaryData: number;
  age: string;
}

interface SecretSummary {
  name: string;
  namespace: string;
  type: string;
  dataCount: number;
  age: string;
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

interface MetricsResponse {
  pods: ResourceMetrics[];
  totalCpu: string;
  totalMemory: string;
  podCount: number;
}

type ResourceType = "namespaces" | "pods" | "deployments" | "services" | "ingresses" | "configmaps" | "secrets" | "events" | "metrics";

interface TabConfig {
  id: ResourceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: "namespaces", label: "Namespaces", icon: Globe },
  { id: "pods", label: "Pods", icon: Container },
  { id: "deployments", label: "Deployments", icon: Layers },
  { id: "services", label: "Services", icon: Network },
  { id: "ingresses", label: "Ingresses", icon: ArrowLeftRight },
  { id: "configmaps", label: "ConfigMaps", icon: FileJson },
  { id: "secrets", label: "Secrets", icon: KeyRound },
  { id: "events", label: "Events", icon: Activity },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
];

function StatusBadge({ status }: { status: string }) {
  const variant = status === "Running" || status === "Active" || status === "Ready"
    ? "success" as const
    : status === "Pending" || status === "ContainerCreating"
      ? "warning" as const
      : status === "Error" || status === "CrashLoopBackOff" || status === "Failed" || status === "Evicted"
        ? "destructive" as const
        : "secondary" as const;

  const dotColor = status === "Running" || status === "Active" || status === "Ready"
    ? "bg-emerald-500"
    : status === "Pending" || status === "ContainerCreating"
      ? "bg-amber-500"
      : status === "Error" || status === "CrashLoopBackOff" || status === "Failed" || status === "Evicted"
        ? "bg-red-500"
        : "bg-zinc-500";

  return (
    <Badge variant={variant} className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </Badge>
  );
}

function PodStatusDot({ status }: { status: string }) {
  const color = status === "Running"
    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
    : status === "Pending" || status === "ContainerCreating"
      ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
      : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function MetricBar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#c1c6d7]">{label}</span>
        <span className="text-[#e0e2ed] font-mono">{value}{unit}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#272a32] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
      <p className="text-sm text-red-400 mb-2">Failed to load data</p>
      <p className="text-xs text-[#c1c6d7] max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg border border-[#414754] px-4 py-2 text-sm text-[#e0e2ed] hover:bg-[#272a32] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export function KubernetesClientPage() {
  const [activeTab, setActiveTab] = useState<ResourceType>("pods");
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");

  const [pods, setPods] = useState<PodSummary[]>([]);
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [ingresses, setIngresses] = useState<IngressSummary[]>([]);
  const [configMaps, setConfigMaps] = useState<ConfigMapSummary[]>([]);
  const [secrets, setSecrets] = useState<SecretSummary[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [namespaceList, setNamespaceList] = useState<NamespaceSummary[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/kubernetes/namespaces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const ns = data as string[];
          setNamespaces(ns);
          if (ns.length > 0 && !ns.includes(selectedNamespace)) {
            setSelectedNamespace(ns[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nsParam = activeTab === "namespaces" || activeTab === "metrics" ? "" : `?namespace=${encodeURIComponent(selectedNamespace)}`;
      const baseUrl = `/api/kubernetes/${activeTab}${nsParam}`;
      const res = await fetch(baseUrl);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `Failed to fetch ${activeTab}`);
      }
      const data = await res.json();

      switch (activeTab) {
        case "pods":
          setPods(data as PodSummary[]);
          break;
        case "deployments":
          setDeployments(data as DeploymentSummary[]);
          break;
        case "services":
          setServices(data as ServiceSummary[]);
          break;
        case "ingresses":
          setIngresses(data as IngressSummary[]);
          break;
        case "configmaps":
          setConfigMaps(data as ConfigMapSummary[]);
          break;
        case "secrets":
          setSecrets(data as SecretSummary[]);
          break;
        case "events":
          setEvents(data as EventSummary[]);
          break;
        case "metrics":
          setMetrics(data as MetricsResponse);
          break;
        case "namespaces":
          setNamespaceList((data as string[]).map((n) => ({ name: n })));
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedNamespace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPods = useMemo(
    () => pods.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [pods, searchQuery],
  );

  const filteredDeployments = useMemo(
    () => deployments.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [deployments, searchQuery],
  );

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    return events.filter(
      (e) =>
        e.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.involvedObject.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [events, searchQuery]);

  function formatTimestamp(t: string | undefined) {
    if (!t) return "";
    try {
      return formatDistanceToNow(new Date(t), { addSuffix: true });
    } catch {
      return t;
    }
  }

  const renderContent = () => {
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-[#c1c6d7]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading {activeTab}...</span>
          </div>
          <SkeletonTable rows={6} cols={activeTab === "pods" ? 6 : activeTab === "events" ? 7 : 4} />
        </div>
      );
    }

    const noData = (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Box className="h-10 w-10 text-[#414754] mb-3" />
        <p className="text-sm text-[#c1c6d7]">No {activeTab} found</p>
        <p className="text-xs text-[#414754] mt-1">No resources in this namespace</p>
      </div>
    );

    switch (activeTab) {
      case "pods":
        return filteredPods.length === 0 && !searchQuery ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Node</th>
                  <th className="pb-3 pr-4 font-medium">IP</th>
                  <th className="pb-3 pr-4 font-medium">Restarts</th>
                  <th className="pb-3 pr-4 font-medium">Age</th>
                  <th className="pb-3 font-medium">Containers</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredPods.map((pod, i) => (
                    <motion.tr
                      key={pod.name}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                    >
                      <td className="py-3 pr-4">
                        <PodStatusDot status={pod.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/dashboard/kubernetes/pods/${pod.name}?namespace=${encodeURIComponent(pod.namespace)}`}
                          className="text-[#0070f3] hover:underline flex items-center gap-1"
                        >
                          {pod.name}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[#c1c6d7]">{pod.node || "-"}</td>
                      <td className="py-3 pr-4 text-[#c1c6d7] font-mono text-xs">{pod.ip || "-"}</td>
                      <td className="py-3 pr-4">
                        <span className={pod.restarts > 0 ? "text-amber-400" : "text-[#c1c6d7]"}>
                          {pod.restarts}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[#c1c6d7]">{pod.age}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {pod.containers.map((c) => (
                            <span
                              key={c.name}
                              className={`inline-block h-5 w-1.5 rounded-sm ${c.ready ? "bg-emerald-500" : "bg-red-500"}`}
                              title={`${c.name}: ${c.ready ? "Ready" : "Not Ready"}`}
                            />
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        );

      case "deployments":
        return filteredDeployments.length === 0 && !searchQuery ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Strategy</th>
                  <th className="pb-3 pr-4 font-medium">Replicas</th>
                  <th className="pb-3 pr-4 font-medium">Ready</th>
                  <th className="pb-3 pr-4 font-medium">Available</th>
                  <th className="pb-3 pr-4 font-medium">Updated</th>
                  <th className="pb-3 pr-4 font-medium">Age</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeployments.map((dep, i) => (
                  <motion.tr
                    key={dep.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                  >
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed]">{dep.name}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{dep.strategy}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{dep.replicas}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{dep.readyReplicas}</td>
                    <td className="py-3 pr-4">
                      <span className={dep.availableReplicas === dep.replicas ? "text-emerald-400" : "text-amber-400"}>
                        {dep.availableReplicas}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{dep.updatedReplicas}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{dep.age}</td>
                    <td className="py-3">
                      <StatusBadge status={dep.availableReplicas >= dep.replicas ? "Ready" : "Pending"} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "services":
        return services.length === 0 ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Cluster IP</th>
                  <th className="pb-3 pr-4 font-medium">External IP</th>
                  <th className="pb-3 pr-4 font-medium">Port(s)</th>
                  <th className="pb-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, i) => (
                  <motion.tr
                    key={svc.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                  >
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed]">{svc.name}</td>
                    <td className="py-3 pr-4">{svc.type === "LoadBalancer" ? <Badge variant="success">{svc.type}</Badge> : <Badge variant="secondary">{svc.type}</Badge>}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-[#c1c6d7]">{svc.clusterIP || "-"}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-[#c1c6d7]">{svc.externalIP || "-"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {svc.ports.map((p) => (
                          <Badge key={`${p.port}-${p.protocol}`} variant="outline" className="text-xs font-mono">
                            {p.port}/{p.protocol}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-[#c1c6d7]">{svc.age}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "ingresses":
        return ingresses.length === 0 ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Class</th>
                  <th className="pb-3 pr-4 font-medium">Hosts</th>
                  <th className="pb-3 pr-4 font-medium">TLS</th>
                  <th className="pb-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {ingresses.map((ing, i) => (
                  <motion.tr
                    key={ing.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                  >
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed]">{ing.name}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{ing.className || "none"}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-0.5">
                        {ing.hosts.map((h) => (
                          <span key={h} className="text-xs text-[#0070f3]">{h}</span>
                        ))}
                        {ing.hosts.length === 0 && <span className="text-xs text-[#414754]">*</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {ing.tls ? <Badge variant="success">Yes</Badge> : <Badge variant="secondary">No</Badge>}
                    </td>
                    <td className="py-3 text-[#c1c6d7]">{ing.age}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "configmaps":
        return configMaps.length === 0 ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Data</th>
                  <th className="pb-3 pr-4 font-medium">Binary Data</th>
                  <th className="pb-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {configMaps.map((cm, i) => (
                  <motion.tr
                    key={cm.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                  >
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed]">{cm.name}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{cm.data} keys</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{cm.binaryData > 0 ? `${cm.binaryData} keys` : "-"}</td>
                    <td className="py-3 text-[#c1c6d7]">{cm.age}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "secrets":
        return secrets.length === 0 ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Data</th>
                  <th className="pb-3 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {secrets.map((sec, i) => (
                  <motion.tr
                    key={sec.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                  >
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed]">{sec.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-xs">{sec.type}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{sec.dataCount} keys</td>
                    <td className="py-3 text-[#c1c6d7]">{sec.age}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "events":
        return filteredEvents.length === 0 && !searchQuery ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Reason</th>
                  <th className="pb-3 pr-4 font-medium">Object</th>
                  <th className="pb-3 pr-4 font-medium">Message</th>
                  <th className="pb-3 pr-4 font-medium">Source</th>
                  <th className="pb-3 pr-4 font-medium">Count</th>
                  <th className="pb-3 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt, i) => (
                  <motion.tr
                    key={evt.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27]"
                  >
                    <td className="py-3 pr-4">
                      <Badge variant={evt.type === "Normal" ? "success" : "destructive"} className="text-xs">
                        {evt.type}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed] whitespace-nowrap">{evt.reason}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7] text-xs">
                      {evt.kind}/{evt.involvedObject}
                    </td>
                    <td className="py-3 pr-4 text-[#c1c6d7] max-w-xs truncate" title={evt.message}>
                      {evt.message}
                    </td>
                    <td className="py-3 pr-4 text-[#c1c6d7] text-xs">{evt.source}</td>
                    <td className="py-3 pr-4 text-[#c1c6d7]">{evt.count}</td>
                    <td className="py-3 text-[#c1c6d7] text-xs whitespace-nowrap">
                      {formatTimestamp(evt.lastTimestamp)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "metrics":
        return !metrics ? noData : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-[#414754] bg-[#1c1f27]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-blue-600/10 p-2">
                    <Cpu className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#c1c6d7]">Total CPU</p>
                    <p className="text-lg font-bold text-[#e0e2ed]">{metrics.totalCpu}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#414754] bg-[#1c1f27]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-600/10 p-2">
                    <HardDrive className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#c1c6d7]">Total Memory</p>
                    <p className="text-lg font-bold text-[#e0e2ed]">{metrics.totalMemory}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#414754] bg-[#1c1f27]">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-purple-600/10 p-2">
                    <Container className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#c1c6d7]">Pods with Metrics</p>
                    <p className="text-lg font-bold text-[#e0e2ed]">{metrics.podCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {metrics.pods.length > 0 && (
              <Card className="border-[#414754] bg-[#1c1f27]">
                <CardHeader>
                  <CardTitle className="text-sm text-[#e0e2ed]">Pod Resource Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics.pods.map((m) => {
                    const maxCpu = Math.max(...metrics.pods.map((p) => p.cpuValue), 1);
                    const maxMem = Math.max(...metrics.pods.map((p) => p.memoryValue), 1);
                    return (
                      <div key={m.name} className="space-y-2 pb-3 border-b border-[#414754]/50 last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-[#e0e2ed]">{m.name}</span>
                            {m.namespace && <span className="text-xs text-[#c1c6d7] ml-2">({m.namespace})</span>}
                          </div>
                          <span className="text-xs text-[#c1c6d7]">{m.cpu} / {m.memory}</span>
                        </div>
                        <MetricBar label="CPU" value={m.cpuValue} max={maxCpu} unit="m" color="bg-blue-500" />
                        <MetricBar label="Memory" value={Math.round(m.memoryValue / (1024 * 1024))} max={Math.round(maxMem / (1024 * 1024))} unit="Mi" color="bg-emerald-500" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "namespaces":
        return namespaceList.length === 0 ? noData : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#414754] text-left text-xs text-[#c1c6d7]">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {namespaceList.map((ns, i) => (
                  <motion.tr
                    key={ns.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#414754]/50 transition-colors hover:bg-[#1c1f27] cursor-pointer"
                    onClick={() => { setSelectedNamespace(ns.name); setActiveTab("pods"); }}
                  >
                    <td className="py-3 pr-4 font-medium text-[#e0e2ed]">{ns.name}</td>
                    <td className="py-3">
                      <StatusBadge status={ns.status || "Active"} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Kubernetes</h1>
            <p className="text-sm text-[#c1c6d7]">Cluster resources and management</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-[#414754] px-4 py-2 text-sm text-[#e0e2ed] hover:bg-[#272a32] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex shrink-0 gap-1 overflow-x-auto lg:w-48 lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#0070f3]/10 text-[#0070f3] border border-[#0070f3]/30"
                      : "text-[#c1c6d7] hover:bg-[#272a32] border border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {activeTab !== "namespaces" && activeTab !== "metrics" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c1c6d7]">Namespace:</span>
                  <Select
                    value={selectedNamespace}
                    onValueChange={setSelectedNamespace}
                  >
                    <SelectTrigger className="w-40 border-[#414754] bg-[#1c1f27] text-[#e0e2ed]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#414754] bg-[#1c1f27]">
                      {namespaces.map((ns) => (
                        <SelectItem key={ns} value={ns} className="text-[#e0e2ed] focus:bg-[#272a32]">
                          {ns}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {activeTab !== "namespaces" && activeTab !== "metrics" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#414754]" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 border-[#414754] bg-[#1c1f27] pl-9 text-[#e0e2ed] placeholder:text-[#414754]"
                  />
                </div>
              )}
            </div>

            <Card className="border-[#414754] bg-[#1c1f27]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base capitalize text-[#e0e2ed]">
                  {tabs.find((t) => t.id === activeTab) && (() => {
                    const Icon = tabs.find((t) => t.id === activeTab)!.icon;
                    return <Icon className="h-4 w-4 text-[#0070f3]" />;
                  })()}
                  {activeTab}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
