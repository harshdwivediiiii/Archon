"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Server,
  Loader2,
  Search,
  ZoomIn,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Network,
  Layers,
  BarChart3,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTechIcon, NODE_TYPE_ICON_MAP } from "@/lib/analysis/tech-icons";

interface ImportedRepo {
  id: string;
  fullName: string;
  name?: string;
  defaultBranch?: string;
  lastSyncedAt?: string;
}

interface AnalysisProgress {
  analysisId: string;
  stage: string;
  progress: number;
  status: string;
  error?: string;
}

interface TechInsight {
  name: string;
  role: string;
}

interface ArchitectureInsight {
  pattern: string;
  confidence: number;
  description: string;
}

interface AiAnalysisData {
  pattern?: string;
  patterns?: ArchitectureInsight[];
  summary?: string;
  technologyStack?: TechInsight[];
  recommendations?: string[];
  enrichedDescriptions?: Record<string, string>;
  enrichedRelationships?: { source: string; target: string; description: string; type: string }[];
  architectureStyle?: string;
  complexity?: string;
  scalability?: string;
}

const STAGE_LABELS: Record<string, string> = {
  pending: "Waiting to start...",
  cloning: "Cloning repository...",
  analyzing: "Analyzing source code...",
  graph: "Building knowledge graph...",
  ai_analysis: "Analyzing architecture with AI...",
  diagrams: "Generating architecture diagrams...",
  docs: "Generating documentation...",
  completed: "Analysis complete!",
  failed: "Analysis failed",
};

type FlowNode = Node<{
  label: string;
  description: string;
  technology: string;
  dependencyCount: number;
  nodeType: string;
  filePath?: string;
  functions?: string[];
  classes?: string[];
  interfaces?: string[];
  dependencies?: string[];
  dependents?: string[];
  sourceFile?: string;
  port?: number;
  envVars?: string[];
  technologyIcon?: string;
}>;

type FlowEdge = Edge;

const NODE_COLORS: Record<string, string> = {
  frontend: "#3b82f6",
  backend: "#10b981",
  database: "#f59e0b",
  infrastructure: "#8b5cf6",
  service: "#06b6d4",
  library: "#6b7280",
  queue: "#ef4444",
};

function TechIconDisplay({ technology, nodeType }: { technology?: string; nodeType: string }) {
  const Component = technology
    ? getTechIcon(technology)
    : NODE_TYPE_ICON_MAP[nodeType] || Server;
  const color = NODE_COLORS[nodeType] || "#6b7280";
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20` }}>
      {React.createElement(Component, { size: 18, className: "text-white" })}
    </div>
  );
}

function CustomNode({ data }: { data: FlowNode["data"] }) {
  return (
    <div className="glass-panel rounded-xl border border-zinc-700/50 bg-[#10131b]/90 px-4 py-3 shadow-lg backdrop-blur-md transition-all hover:border-zinc-500/50 hover:shadow-xl min-w-[200px]">
      <div className="flex items-center gap-3">
        <TechIconDisplay technology={data.technologyIcon} nodeType={data.nodeType} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#e0e2ed]">{data.label}</p>
          {data.technology && (
            <p className="truncate text-xs text-zinc-500">{data.technology}</p>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
        {data.description}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-400 px-1.5 py-0">
          {data.nodeType}
        </Badge>
        {data.dependencyCount > 0 && (
          <span className="text-[10px] text-zinc-500">{data.dependencyCount} deps</span>
        )}
        {data.port && (
          <span className="text-[10px] text-zinc-500">:{data.port}</span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
  default: CustomNode,
};

function buildEdge(id: string, source: string, target: string, label?: string): FlowEdge {
  return {
    id,
    source,
    target,
    label: label || "",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#6366f1", strokeWidth: 2 },
    labelStyle: { fill: "#a1a1aa", fontSize: 11 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: "#6366f1",
    },
  };
}

function buildNode(
  id: string,
  label: string,
  description: string,
  technology: string,
  nodeType: string,
  dependencyCount = 0,
  position?: { x: number; y: number },
  extra?: Partial<FlowNode["data"]>
): FlowNode {
  return {
    id,
    type: "custom",
    position: position || { x: 100 + Math.random() * 400, y: 50 + Math.random() * 300 },
    data: { label, description, technology, dependencyCount, nodeType, ...extra },
  };
}

export default function ArchitecturePage() {
  const [repos, setRepos] = useState<ImportedRepo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const [analysisExists, setAnalysisExists] = useState(false);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/repositories");
        if (res.ok) {
          const data = await res.json();
          setRepos(data || []);
          if (data?.length > 0) {
            setSelectedRepoId(data[0].id);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRepoId) return;

    let cancelled = false;

    const fetchResults = async () => {
      setLoadingDiagram(true);
      try {
        const res = await fetch(`/api/analysis/results/${selectedRepoId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAnalysisData(data);
          setAnalysisExists(!!data.analysis);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingDiagram(false);
      }
    };

    fetchResults();

    return () => { cancelled = true; };
  }, [selectedRepoId]);

  useEffect(() => {
    if (!analysisData) return;
    const diagramNodes: FlowNode[] = [];
    const diagramEdges: FlowEdge[] = [];

    const diagrams = (analysisData.diagrams as Array<Record<string, unknown>>) || [];
    const graph = analysisData.graph as Record<string, unknown> | undefined;

    if (diagrams.length > 0) {
      for (const diagram of diagrams) {
        const dNodes = (diagram.nodes as Array<Record<string, unknown>>) || [];
        const dEdges = (diagram.edges as Array<Record<string, unknown>>) || [];
        for (const n of dNodes) {
          const nodeData = n.data as Record<string, unknown> || {};
          diagramNodes.push(
            buildNode(
              (n.id as string) || `node-${Math.random()}`,
              (nodeData.label as string) || (n.id as string),
              (nodeData.description as string) || "",
              (nodeData.technology as string) || "",
              (nodeData.nodeType as string) || "service",
              (nodeData.dependencyCount as number) || 0,
              n.position as { x: number; y: number } | undefined,
              {
                ...nodeData,
                technologyIcon: (nodeData.technologyIcon as string) || (nodeData.technology as string) || "",
              } as Partial<FlowNode["data"]>
            )
          );
        }
        for (const e of dEdges) {
          diagramEdges.push(
            buildEdge(
              (e.id as string) || `e-${e.source}-${e.target}`,
              e.source as string,
              e.target as string,
              e.label as string
            )
          );
        }
      }
    }

    if (graph) {
      const gNodes = (graph.nodes as Array<Record<string, unknown>>) || [];
      const gEdges = (graph.edges as Array<Record<string, unknown>>) || [];

      for (const kn of gNodes) {
        if (!diagramNodes.find((n) => n.id === (kn.id as string))) {
          diagramNodes.push(
            buildNode(
              kn.id as string,
              (kn.label as string) || "",
              (kn.description as string) || "",
              ((kn.metadata as Record<string, string>)?.technology) as string || (kn.type as string),
              (kn.type as string) || "service",
              0,
              undefined,
              {
                filePath: (kn.metadata as Record<string, string>)?.sourcePath || (kn.metadata as Record<string, string>)?.sourceFile,
                dependencies: (kn.metadata as Record<string, string[]>)?.dependencies,
                technologyIcon: ((kn.metadata as Record<string, string>)?.technology) as string || (kn.type as string),
              }
            )
          );
        }
      }

      for (const ke of gEdges) {
        const sourceId = (ke.sourceId || ke.source) as string;
        const targetId = (ke.targetId || ke.target) as string;
        if (!diagramEdges.find((e) => e.source === sourceId && e.target === targetId)) {
          diagramEdges.push(buildEdge(`e-${sourceId}-${targetId}`, sourceId, targetId, ke.label as string));
        }
      }
    }

    if (diagramNodes.length === 0 && analysisExists) {
      setNodes([]);
      setEdges([]);
    } else {
      setNodes(diagramNodes);
      setEdges(diagramEdges);
    }
  }, [analysisData, analysisExists, setNodes, setEdges]);

  async function handleSync() {
    if (!selectedRepoId) return;
    setSyncing(true);
    setSyncProgress({ analysisId: selectedRepoId, stage: "pending", progress: 0, status: "PENDING" });
    setError(null);

    const es = new EventSource(`/api/analysis/progress/${selectedRepoId}`);

    es.onmessage = (event) => {
      try {
        const progress: AnalysisProgress = JSON.parse(event.data);
        setSyncProgress(progress);

        if (progress.status === "COMPLETED") {
          es.close();
          setSyncing(false);
          fetch(`/api/analysis/results/${selectedRepoId}`)
            .then((r) => r.json())
            .then((data) => {
              setAnalysisData(data);
              setAnalysisExists(true);
            })
            .catch(() => {});
        } else if (progress.status === "FAILED") {
          es.close();
          setSyncing(false);
          setError(progress.error || "Analysis failed");
        }
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      es.close();
      setSyncing(false);
    };

    try {
      const syncRes = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: selectedRepoId }),
      });

      if (!syncRes.ok) {
        es.close();
        setSyncing(false);
        const body = await syncRes.json().catch(() => ({ error: "Sync failed" }));
        setError(body.error || "Failed to start analysis");
      }
    } catch (err) {
      es.close();
      setSyncing(false);
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    }
  }

  const filteredNodes = useMemo(() => {
    let result = nodes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.data.label?.toLowerCase().includes(q) ||
          n.data.description?.toLowerCase().includes(q) ||
          n.data.technology?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((n) => n.data.nodeType === typeFilter);
    }
    return result;
  }, [nodes, searchQuery, typeFilter]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(nodes.map((n) => n.data.nodeType).filter(Boolean));
    return ["all", ...types] as string[];
  }, [nodes]);

  function onNodeClick(_: React.MouseEvent, node: FlowNode) {
    setSelectedNode(node);
    setDetailOpen(true);
  }

  const analysis = (analysisData?.analysis as Record<string, unknown>) || null;
  const servicesCount = (analysis?.services as Array<unknown>)?.length || 0;
  const apisCount = (analysis?.apis as Array<unknown>)?.length || 0;
  const databasesCount = (analysis?.databases as Array<unknown>)?.length || 0;
  const dependenciesCount = (analysis?.dependencies as Array<unknown>)?.length || 0;
  const filesCount = (analysis?.files as Array<unknown>)?.length || 0;
  const modulesCount = (analysis?.modules as Array<unknown>)?.length || 0;

  const aiAnalysis = (analysis?.aiAnalysis as AiAnalysisData) || null;

  const edgeCount = edges.length;

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select repository..." />
            </SelectTrigger>
            <SelectContent>
              {repos.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search nodes..."
              className="pl-8 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!analysisExists && !syncing && (
            <Button onClick={handleSync} size="sm">
              <Play className="mr-2 h-4 w-4" />
              Run Analysis
            </Button>
          )}

          {analysisExists && !syncing && (
            <Button onClick={handleSync} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-analyze
            </Button>
          )}

          {analysisExists && aiAnalysis && (
            <Button onClick={() => setAiOpen(true)} size="sm" variant="secondary">
              <Lightbulb className="mr-2 h-4 w-4" />
              AI Insights
            </Button>
          )}

          <Badge variant="outline" className="border-zinc-700 text-xs text-zinc-400 ml-auto">
            {nodes.length} nodes / {edgeCount} edges
          </Badge>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {syncing && syncProgress && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncProgress.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : syncProgress.status === "FAILED" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                )}
                <span className="text-xs font-medium text-zinc-300">
                  {STAGE_LABELS[syncProgress.stage] || syncProgress.stage}
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-500">{syncProgress.progress}%</span>
            </div>
            <Progress value={syncProgress.progress} className="h-1.5" />
          </div>
        )}

        {analysisExists && analysis && (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">Services</p>
              <p className="text-lg font-semibold text-white">{servicesCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">APIs</p>
              <p className="text-lg font-semibold text-white">{apisCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">Databases</p>
              <p className="text-lg font-semibold text-white">{databasesCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">Dependencies</p>
              <p className="text-lg font-semibold text-white">{dependenciesCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">Modules</p>
              <p className="text-lg font-semibold text-white">{modulesCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">Files</p>
              <p className="text-lg font-semibold text-white">{filesCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <p className="text-xs text-zinc-500">Edges</p>
              <p className="text-lg font-semibold text-white">{edgeCount}</p>
            </div>
            {aiAnalysis?.architectureStyle && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                <p className="text-xs text-zinc-500">Architecture</p>
                <p className="text-lg font-semibold text-white text-sm truncate">
                  {aiAnalysis.architectureStyle}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1 min-h-[600px] rounded-xl overflow-hidden">
          {loading || (loadingDiagram && !analysisData) ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : !analysisExists && !syncing ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
                  <Server className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Architecture Data</h3>
                <p className="text-sm text-zinc-400 mb-6 max-w-md">
                  Select a repository and run analysis to see real architecture diagrams, dependency graphs, and AI-powered tech stack detection.
                </p>
                <Button onClick={handleSync}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Analysis
                </Button>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
              minZoom={0.1}
              maxZoom={4}
              defaultEdgeOptions={{
                type: "smoothstep",
                animated: true,
                style: { stroke: "#6366f1", strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: "#6366f1",
                },
              }}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#272a32" />
              <Controls className="glass-panel rounded-lg border-zinc-700" showInteractive={false} />
              <MiniMap
                nodeColor="#272a32"
                maskColor="rgba(16,19,27,0.8)"
                className="glass-panel rounded-lg border-zinc-700"
              />
            </ReactFlow>
          )}
        </div>

        <button className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary-foreground shadow-lg transition-transform hover:scale-110">
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNode && (
                <>
                  <TechIconDisplay
                    technology={selectedNode.data.technologyIcon}
                    nodeType={selectedNode.data.nodeType}
                  />
                  {selectedNode.data.label || "Node Details"}
                </>
              )}
            </DialogTitle>
            <DialogDescription>Architecture Component Details</DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-1">Description</p>
                  <p className="text-sm text-zinc-300">{selectedNode.data.description || "No description available"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500">Technology</p>
                    <p className="text-sm font-medium text-white mt-1">{selectedNode.data.technology || "N/A"}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500">Type</p>
                    <p className="text-sm font-medium text-white mt-1 capitalize">{selectedNode.data.nodeType || "service"}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500">Dependencies</p>
                    <p className="text-sm font-medium text-white mt-1">{selectedNode.data.dependencyCount || 0}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 p-3">
                    <p className="text-xs text-zinc-500">Node ID</p>
                    <p className="text-sm font-medium text-white mt-1 font-mono text-xs truncate">{selectedNode.id}</p>
                  </div>
                  {selectedNode.data.port && (
                    <div className="rounded-lg border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500">Port</p>
                      <p className="text-sm font-medium text-white mt-1">:{selectedNode.data.port}</p>
                    </div>
                  )}
                </div>

                {selectedNode.data.filePath && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1">Source File</p>
                    <p className="text-sm font-mono text-zinc-300 bg-zinc-900 rounded p-2 truncate">
                      {selectedNode.data.filePath}
                    </p>
                  </div>
                )}

                {selectedNode.data.functions && selectedNode.data.functions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1">Exported Functions ({selectedNode.data.functions.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.data.functions.map((fn) => (
                        <Badge key={fn} variant="outline" className="border-zinc-700 text-[10px] text-zinc-300">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.data.classes && selectedNode.data.classes.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1">Classes ({selectedNode.data.classes.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.data.classes.map((cls) => (
                        <Badge key={cls} variant="outline" className="border-zinc-700 text-[10px] text-zinc-300">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.data.envVars && selectedNode.data.envVars.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1">Environment Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.data.envVars.map((env) => (
                        <Badge key={env} variant="outline" className="border-zinc-700 text-[10px] text-zinc-300 font-mono">
                          {env}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.data.dependencies && selectedNode.data.dependencies.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1">Import Dependencies</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.data.dependencies.map((dep) => (
                        <Badge key={dep} variant="outline" className="border-zinc-700 text-[10px] text-zinc-300">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              AI Architecture Insights
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of your repository architecture
            </DialogDescription>
          </DialogHeader>
          {aiAnalysis && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-5 pr-4">
                {aiAnalysis.summary && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <p className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Architecture Summary
                    </p>
                    <p className="text-sm text-zinc-200 leading-relaxed">{aiAnalysis.summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {aiAnalysis.architectureStyle && (
                    <div className="rounded-lg border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        Architecture Style
                      </p>
                      <p className="text-sm font-semibold text-white">{aiAnalysis.architectureStyle}</p>
                    </div>
                  )}
                  {aiAnalysis.complexity && (
                    <div className="rounded-lg border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Complexity
                      </p>
                      <p className="text-sm font-semibold text-white">{aiAnalysis.complexity}</p>
                    </div>
                  )}
                  {aiAnalysis.scalability && (
                    <div className="rounded-lg border border-zinc-800 p-3 col-span-2">
                      <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                        <Network className="h-3.5 w-3.5" />
                        Scalability
                      </p>
                      <p className="text-sm text-zinc-200">{aiAnalysis.scalability}</p>
                    </div>
                  )}
                </div>

                {aiAnalysis.patterns && aiAnalysis.patterns.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-2">Detected Architecture Patterns</p>
                    <div className="space-y-2">
                      {aiAnalysis.patterns.map((p, i) => (
                        <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-white">{p.pattern}</p>
                            <Badge variant="outline" className="border-zinc-700 text-[10px]">
                              {Math.round(p.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-400">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.technologyStack && aiAnalysis.technologyStack.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-2">Technology Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.technologyStack.map((t, i) => {
                        const Icon = getTechIcon(t.name);
                        return (
                          <Badge key={i} variant="outline" className="border-zinc-700 text-xs text-zinc-300 px-2 py-1 flex items-center gap-1.5">
                            <Icon size={12} className="text-zinc-400" />
                            {t.name}
                            <span className="text-zinc-500">- {t.role}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {aiAnalysis.enrichedRelationships && aiAnalysis.enrichedRelationships.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-2">Detected Relationships</p>
                    <div className="space-y-1.5">
                      {aiAnalysis.enrichedRelationships.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="font-medium text-white">{r.source}</span>
                          <span className="text-zinc-500 text-xs">
                            {r.type === "api_call" ? "→" : r.type === "data_flow" ? "⇢" : r.type === "event" ? "⚡" : "→"}
                          </span>
                          <span className="font-medium text-white">{r.target}</span>
                          <span className="text-zinc-500 text-xs ml-1">({r.description})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-2">Recommendations</p>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="text-yellow-400 mt-0.5 text-xs">◆</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
