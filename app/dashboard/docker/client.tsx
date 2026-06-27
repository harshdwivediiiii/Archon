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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Container,
  Image,
  HardDrive,
  Network,
  Activity,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Trash2,
  Loader2,
  AlertCircle,
  Server,
  Cpu,
  Wifi,
  Database,
  X,
  Search,
  RefreshCw,
} from "lucide-react";

interface DockerSummary {
  images: { total: number; size: number };
  containers: { total: number; running: number; size: number };
  volumes: { total: number; size: number };
  buildCache: { count: number; size: number };
  totalSize: number;
  reclaimableSize: number;
}

interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  created: string;
  size: string;
  sizeBytes: number;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: string;
  ports: { hostIp: string; hostPort: number; containerPort: number; type: string }[];
}

interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  created: string;
  size?: number;
}

interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  subnet: string;
  attachedContainers: { name: string; ip: string }[];
}

interface ContainerStats {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  pids: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function containerStateColor(state: string) {
  switch (state) {
    case "running": return "success";
    case "exited":
    case "stopped": return "destructive";
    case "paused": return "warning";
    default: return "secondary";
  }
}

export function DockerDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DockerSummary | null>(null);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [networks, setNetworks] = useState<DockerNetwork[]>([]);
  const [activeTab, setActiveTab] = useState("images");
  const [searchQuery, setSearchQuery] = useState("");

  const [statsContainer, setStatsContainer] = useState<string | null>(null);
  const [containerStats, setContainerStats] = useState<ContainerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [logsContainer, setLogsContainer] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState<string>("");
  const [logsLoading, setLogsLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, imagesRes, containersRes, volumesRes, networksRes] = await Promise.all([
        fetch("/api/docker"),
        fetch("/api/docker/images"),
        fetch("/api/docker/containers?all=true"),
        fetch("/api/docker/volumes"),
        fetch("/api/docker/networks"),
      ]);

      if (!summaryRes.ok) {
        const err = await summaryRes.json();
        throw new Error(err.error || "Failed to fetch Docker data");
      }

      const [summaryData, imagesData, containersData, volumesData, networksData] = await Promise.all([
        summaryRes.json(),
        imagesRes.ok ? imagesRes.json() : [],
        containersRes.ok ? containersRes.json() : [],
        volumesRes.ok ? volumesRes.json() : [],
        networksRes.ok ? networksRes.json() : [],
      ]);

      setSummary(summaryData);
      setImages(imagesData);
      setContainers(containersData);
      setVolumes(volumesData);
      setNetworks(networksData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch Docker data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleContainerAction = async (id: string, action: "start" | "stop" | "restart") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/docker/containers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} container`);
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePruneImages = async () => {
    setActionLoading("prune-images");
    try {
      await fetch("/api/docker/images", { method: "POST" });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePruneVolumes = async () => {
    setActionLoading("prune-volumes");
    try {
      await fetch("/api/docker/volumes", { method: "DELETE" });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const openStats = async (id: string) => {
    setStatsContainer(id);
    setStatsLoading(true);
    setContainerStats(null);
    try {
      const res = await fetch(`/api/docker/containers/${id}/stats`);
      if (res.ok) {
        const data: ContainerStats = await res.json();
        setContainerStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const openLogs = async (id: string) => {
    setLogsContainer(id);
    setLogsLoading(true);
    setContainerLogs("");
    try {
      const res = await fetch(`/api/docker/containers/${id}/logs?tail=200&timestamps=true`);
      if (res.ok) {
        const data = await res.json();
        setContainerLogs((data.stdout || "") + (data.stderr ? "\n" + data.stderr : ""));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredImages = images.filter((img) =>
    `${img.repository}:${img.tag}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredContainers = containers.filter((c) =>
    `${c.name} ${c.image}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVolumes = volumes.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNetworks = networks.filter((n) =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const runningContainers = containers.filter((c) => c.state === "running").length;

  if (error && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Docker Not Available</h2>
          <p className="text-zinc-400 text-center max-w-md">{error}</p>
          <Button onClick={fetchData} className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Docker</h1>
            <p className="text-zinc-400">Manage containers, images, volumes, and networks</p>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <p className="text-sm text-zinc-500">
                {formatBytes(summary.totalSize)} total
              </p>
            )}
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
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
                  <p className="text-sm text-zinc-400">Images</p>
                  <p className="text-2xl font-bold text-white">{summary?.images.total ?? 0}</p>
                  {summary && (
                    <p className="text-xs text-zinc-500">{formatBytes(summary.images.size)}</p>
                  )}
                </div>
                <div className="rounded-lg bg-blue-600/10 p-3">
                  <Image className="h-5 w-5 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Containers</p>
                  <p className="text-2xl font-bold text-white">{summary?.containers.total ?? 0}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="success" className="text-[10px] px-1.5 py-0">
                      {runningContainers} running
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {(summary?.containers.total ?? 0) - runningContainers} stopped
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-600/10 p-3">
                  <Container className="h-5 w-5 text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Volumes</p>
                  <p className="text-2xl font-bold text-white">{summary?.volumes.total ?? 0}</p>
                  {summary && (
                    <p className="text-xs text-zinc-500">{formatBytes(summary.volumes.size)}</p>
                  )}
                </div>
                <div className="rounded-lg bg-amber-600/10 p-3">
                  <HardDrive className="h-5 w-5 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">Networks</p>
                  <p className="text-2xl font-bold text-white">{networks.length}</p>
                </div>
                <div className="rounded-lg bg-purple-600/10 p-3">
                  <Network className="h-5 w-5 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Manage your Docker resources</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-48"
                />
              </div>
              {activeTab === "images" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePruneImages}
                  disabled={actionLoading === "prune-images"}
                >
                  {actionLoading === "prune-images" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Prune
                </Button>
              )}
              {activeTab === "volumes" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePruneVolumes}
                  disabled={actionLoading === "prune-volumes"}
                >
                  {actionLoading === "prune-volumes" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Prune
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="images">
                  <Image className="mr-2 h-4 w-4" />
                  Images ({images.length})
                </TabsTrigger>
                <TabsTrigger value="containers">
                  <Container className="mr-2 h-4 w-4" />
                  Containers ({containers.length})
                </TabsTrigger>
                <TabsTrigger value="volumes">
                  <HardDrive className="mr-2 h-4 w-4" />
                  Volumes ({volumes.length})
                </TabsTrigger>
                <TabsTrigger value="networks">
                  <Network className="mr-2 h-4 w-4" />
                  Networks ({networks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Repository</th>
                          <th className="pb-3 pr-4 font-medium">Tag</th>
                          <th className="pb-3 pr-4 font-medium">Size</th>
                          <th className="pb-3 pr-4 font-medium">Created</th>
                          <th className="pb-3 pr-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredImages.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500">
                              {searchQuery ? "No images match your search" : "No images found"}
                            </td>
                          </tr>
                        ) : (
                          filteredImages.map((img) => (
                            <tr key={img.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                              <td className="py-3 pr-4">
                                <span className="text-white">
                                  {img.repository || "&lt;none&gt;"}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {img.tag || "&lt;none&gt;"}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4 text-zinc-300">{img.size}</td>
                              <td className="py-3 pr-4 text-zinc-400 text-xs">
                                {formatDistanceToNow(new Date(img.created), { addSuffix: true })}
                              </td>
                              <td className="py-3">
                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-400">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="containers">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Name</th>
                          <th className="pb-3 pr-4 font-medium">Image</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Ports</th>
                          <th className="pb-3 pr-4 font-medium">Created</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContainers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-500">
                              {searchQuery ? "No containers match your search" : "No containers found"}
                            </td>
                          </tr>
                        ) : (
                          filteredContainers.map((c) => (
                            <tr key={c.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                              <td className="py-3 pr-4">
                                <span className="text-white font-medium">{c.name}</span>
                              </td>
                              <td className="py-3 pr-4 text-zinc-300">{c.image}</td>
                              <td className="py-3 pr-4">
                                <Badge variant={containerStateColor(c.state)} className="capitalize">
                                  {c.state}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4 text-zinc-400 text-xs">
                                {c.ports.length > 0
                                  ? c.ports.map((p) => `${p.hostPort}:${p.containerPort}`).join(", ")
                                  : "—"}
                              </td>
                              <td className="py-3 pr-4 text-zinc-400 text-xs">
                                {formatDistanceToNow(new Date(c.created), { addSuffix: true })}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-1">
                                  {c.state === "running" ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-zinc-400 hover:text-red-400"
                                      onClick={() => handleContainerAction(c.id, "stop")}
                                      disabled={actionLoading === c.id}
                                    >
                                      {actionLoading === c.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Square className="h-4 w-4" />
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-zinc-400 hover:text-emerald-400"
                                      onClick={() => handleContainerAction(c.id, "start")}
                                      disabled={actionLoading === c.id}
                                    >
                                      {actionLoading === c.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:text-blue-400"
                                    onClick={() => handleContainerAction(c.id, "restart")}
                                    disabled={actionLoading === c.id}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:text-amber-400"
                                    onClick={() => openStats(c.id)}
                                  >
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:text-cyan-400"
                                    onClick={() => openLogs(c.id)}
                                  >
                                    <Terminal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="volumes">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Name</th>
                          <th className="pb-3 pr-4 font-medium">Driver</th>
                          <th className="pb-3 pr-4 font-medium">Mount Point</th>
                          <th className="pb-3 pr-4 font-medium">Scope</th>
                          <th className="pb-3 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVolumes.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500">
                              {searchQuery ? "No volumes match your search" : "No volumes found"}
                            </td>
                          </tr>
                        ) : (
                          filteredVolumes.map((v) => (
                            <tr key={v.name} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                              <td className="py-3 pr-4">
                                <span className="text-white font-medium">{v.name}</span>
                              </td>
                              <td className="py-3 pr-4 text-zinc-300">{v.driver}</td>
                              <td className="py-3 pr-4 text-zinc-400 text-xs font-mono">{v.mountpoint}</td>
                              <td className="py-3 pr-4">
                                <Badge variant="outline">{v.scope}</Badge>
                              </td>
                              <td className="py-3 text-zinc-400 text-xs">
                                {formatDistanceToNow(new Date(v.created), { addSuffix: true })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="networks">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400">
                          <th className="pb-3 pr-4 font-medium">Name</th>
                          <th className="pb-3 pr-4 font-medium">Driver</th>
                          <th className="pb-3 pr-4 font-medium">Scope</th>
                          <th className="pb-3 pr-4 font-medium">Subnet</th>
                          <th className="pb-3 font-medium">Containers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNetworks.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-zinc-500">
                              {searchQuery ? "No networks match your search" : "No networks found"}
                            </td>
                          </tr>
                        ) : (
                          filteredNetworks.map((n) => (
                            <tr key={n.id} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                              <td className="py-3 pr-4">
                                <span className="text-white font-medium">{n.name}</span>
                              </td>
                              <td className="py-3 pr-4 text-zinc-300">{n.driver}</td>
                              <td className="py-3 pr-4">
                                <Badge variant="outline">{n.scope}</Badge>
                              </td>
                              <td className="py-3 pr-4 text-zinc-400 text-xs font-mono">{n.subnet || "—"}</td>
                              <td className="py-3 text-zinc-400 text-xs">
                                {n.attachedContainers.length} container{n.attachedContainers.length !== 1 ? "s" : ""}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={!!statsContainer} onOpenChange={(open) => { if (!open) setStatsContainer(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              Container Stats
            </DialogTitle>
            <DialogDescription>
              Real-time resource usage for {statsContainer?.slice(0, 12)}...
            </DialogDescription>
          </DialogHeader>
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : containerStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-zinc-400">CPU</span>
                </div>
                <p className="text-2xl font-bold text-white">{containerStats.cpuPercent.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-zinc-400">Memory</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatBytes(containerStats.memoryUsage)}
                </p>
                <p className="text-xs text-zinc-500">
                  of {formatBytes(containerStats.memoryLimit)} ({containerStats.memoryPercent.toFixed(1)}%)
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-zinc-400">Network</span>
                </div>
                <p className="text-xs text-zinc-300">RX: {formatBytes(containerStats.networkRxBytes)}</p>
                <p className="text-xs text-zinc-300">TX: {formatBytes(containerStats.networkTxBytes)}</p>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-zinc-400">Processes</span>
                </div>
                <p className="text-2xl font-bold text-white">{containerStats.pids}</p>
                <p className="text-xs text-zinc-500">PIDs</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-zinc-500 py-8">Failed to load stats</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!logsContainer} onOpenChange={(open) => { if (!open) setLogsContainer(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              Container Logs
            </DialogTitle>
            <DialogDescription>
              Logs for {logsContainer?.slice(0, 12)}...
            </DialogDescription>
          </DialogHeader>
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-lg border border-zinc-800 bg-black/50 p-4">
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                {containerLogs || "No logs available"}
              </pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
