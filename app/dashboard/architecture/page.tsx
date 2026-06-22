"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Server, Loader2, Search, RefreshCw, Play, CheckCircle2, XCircle, AlertCircle,
  Lightbulb, Network, Layers, BarChart3, FileText, Sparkles, History, Database,
  Package, Globe, Box, Code2, ExternalLink, Eye, ZoomIn, ZoomOut, Maximize, Minimize,
  Expand, Shrink, Info, SlidersHorizontal, ChevronDown, ChevronRight, GitFork,
  Activity, Shield, Gauge, Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTechIcon } from "@/lib/analysis/tech-icons";
import type {
  DetectedService, DetectedApi, DetectedDatabase, DetectedInfrastructure, DetectedModule,
  DetectedEvent, AiAnalysisData,
} from "@/components/architecture/types";
import { ThreeBackground } from "./components/three-background";
import { computeDagreLayout, computeLayerLayout } from "./utils/layout-engine";
import {
  DIAGRAM_MODES, transformSystemView, transformUmlView, transformInfrastructureView,
  transformDataFlowView, transformDependencyView, LAYER_ORDER, type DiagramMode,
  type ModeNode, type ModeEdge,
} from "./utils/mode-transformers";

interface ImportedRepo {
  id: string; fullName: string; name?: string; defaultBranch?: string; lastSyncedAt?: string;
}

interface AnalysisProgress {
  analysisId: string; stage: string; progress: number; status: string; error?: string;
}

const STAGE_LABELS: Record<string, string> = {
  pending: "Waiting to start...", cloning: "Cloning repository...", analyzing: "Analyzing source code...",
  graph: "Building knowledge graph...", ai_analysis: "Analyzing architecture with AI...",
  diagrams: "Generating architecture diagrams...", docs: "Generating documentation...",
  completed: "Analysis complete!", failed: "Analysis failed",
};

const LIVE_STEPS = [
  { key: "cloning", label: "Repository Cloned" }, { key: "analyzing", label: "Dependencies Parsed" },
  { key: "graph", label: "Knowledge Graph Built" }, { key: "diagrams", label: "Architecture Generated" },
  { key: "docs", label: "Documentation Generated" },
];

const NODE_COLORS: Record<string, string> = {
  frontend: "#3b82f6", backend: "#10b981", database: "#f59e0b", infrastructure: "#8b5cf6",
  service: "#06b6d4", library: "#6b7280", queue: "#ef4444", api: "#ec4899",
  uml_class: "#a855f7", uml_interface: "#06b6d4",
};

const STATUS_COLORS: Record<string, string> = {
  healthy: "#22c55e", warning: "#f59e0b", error: "#ef4444", unknown: "#6b7280",
};

function computeStatus(data: ModeNode["data"]): { status: "healthy" | "warning" | "error" | "unknown"; label: string } {
  if (data.dependencyCount > 20) return { status: "warning", label: "complex" };
  if (data.dependencyCount === 0 && data.nodeType !== "frontend" && data.nodeType !== "library") return { status: "warning", label: "isolated" };
  return { status: "unknown", label: "stable" };
}

function TechIconDisplay({ technology, nodeType, size = 18 }: { technology?: string; nodeType: string; size?: number }) {
  const Component = technology ? getTechIcon(technology) : Server;
  const color = NODE_COLORS[nodeType] || "#6b7280";
  return (
    <div className="flex items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20`, width: size + 8, height: size + 8 }}>
      {React.createElement(Component, { size, className: "text-white" })}
    </div>
  );
}

function EnhancedNode({ data, selected }: { data: ModeNode["data"]; selected?: boolean }) {
  const color = NODE_COLORS[data.nodeType] || "#6b7280";
  const { status, label: statusLabel } = computeStatus(data);
  const metrics = data.metrics || [];
  return (
    <div
      className={`rounded-xl px-4 py-3 shadow-lg backdrop-blur-md transition-all min-w-[210px] ${
        selected ? "ring-2 ring-[#0070f3] ring-offset-2 ring-offset-[#10131b]" : ""
      }`}
      style={{
        background: "rgba(16, 19, 27, 0.92)",
        border: `1.5px solid ${color}${selected ? "cc" : "40"}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <TechIconDisplay technology={data.technologyIcon} nodeType={data.nodeType} />
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#10131b]"
            style={{ backgroundColor: STATUS_COLORS[status] }}
            title={statusLabel}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#e0e2ed]">{data.label}</p>
          {data.technology && (
            <p className="truncate text-[11px] text-[#8b90a0]">{data.technology}</p>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[#8b90a0] line-clamp-2">
        {data.description}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="border-[#414754] text-[10px] text-[#8b90a0] px-1.5 py-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
          {data.nodeType}
        </Badge>
        {data.dependencyCount > 0 && (
          <Badge variant="outline" className="border-[#414754]/50 text-[10px] text-[#06b6d4]">
            {data.dependencyCount} deps
          </Badge>
        )}
        {data.endpoints && data.endpoints.length > 0 && (
          <Badge variant="outline" className="border-[#10b981]/30 text-[10px] text-[#10b981]">
            {data.endpoints.length} API
          </Badge>
        )}
        {data.databases && data.databases.length > 0 && (
          <Badge variant="outline" className="border-[#f59e0b]/30 text-[10px] text-[#f59e0b]">
            {data.databases.length} db
          </Badge>
        )}
        {data.port && (
          <span className="text-[10px] font-mono text-[#8b90a0]">:{data.port}</span>
        )}
      </div>
      {metrics.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#414754]/30 flex gap-2">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-1">
              <span className="text-[9px] text-[#8b90a0]">{m.label}</span>
              <span className="text-[10px] font-semibold" style={{ color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { custom: EnhancedNode, default: EnhancedNode };

interface InspectorData {
  id: string; label: string; type: string; technology: string; description: string; layer: string;
  filePath?: string; functions?: string[]; classes?: string[]; interfaces?: string[];
  dependencies?: string[]; dependents?: string[]; endpoints?: string[]; databases?: string[];
  envVars?: string[]; port?: number; status?: string; health?: { score: number; issues: string[] };
  deploymentConfig?: string; repoReferences?: string[];
  methods?: { name: string; params: string; returnType: string; visibility: string }[];
  properties?: { name: string; type: string; visibility: string }[];
  extends?: string; implements?: string[]; serviceData?: DetectedService;
}

function InfoChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-[#414754] bg-[#1c1f27] p-2.5">
      <p className="text-[9px] text-[#8b90a0] uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold mt-0.5 truncate" style={{ color }}>{value}</p>
    </div>
  );
}

function DeepInspectorPanel({
  data, onClose, onViewInKnowledgeGraph, aiInsight,
}: {
  data: InspectorData | null; onClose: () => void; onViewInKnowledgeGraph: (id: string) => void;
  aiInsight?: string;
}) {
  const [activeTab, setActiveTab] = useState<"details" | "ai">("details");
  if (!data) return null;
  const color = NODE_COLORS[data.type] || "#6b7280";
  return (
    <aside className="w-80 shrink-0 glass-panel rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[#414754]/50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <TechIconDisplay technology={data.technology} nodeType={data.type} size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#e0e2ed] truncate">{data.label}</h3>
            <p className="text-[10px] text-[#8b90a0] truncate">{data.technology || data.type}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#8b90a0] hover:text-[#e0e2ed] text-lg leading-none">&times;</button>
      </div>
      <div className="flex border-b border-[#414754]/50">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === "details" ? "text-[#0070f3] border-b-2 border-[#0070f3]" : "text-[#8b90a0] hover:text-[#e0e2ed]"}`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === "ai" ? "text-[#0070f3] border-b-2 border-[#0070f3]" : "text-[#8b90a0] hover:text-[#e0e2ed]"}`}
        >
          AI Insight
        </button>
      </div>
      <ScrollArea className="flex-1 p-4 scrollbar-thin">
        {activeTab === "details" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <InfoChip label="Type" value={data.type} color={color} />
              <InfoChip label="Layer" value={data.layer} color={color} />
              {data.port && <InfoChip label="Port" value={`:${data.port}`} color={color} />}
              <InfoChip label="Confidence" value={data.health?.score ? `${data.health.score}%` : "N/A"} color={color} />
            </div>

            {data.description && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1">Description</p>
                <p className="text-xs text-[#c1c6d7] leading-relaxed">{data.description}</p>
              </div>
            )}

            {data.filePath && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1">Source Files</p>
                <p className="text-xs font-mono text-[#c1c6d7] bg-[#1c1f27] rounded p-2 truncate border border-[#414754]">
                  {data.filePath}
                </p>
              </div>
            )}

            {data.status && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[data.status] || "#6b7280" }} />
                <span className="text-[11px] text-[#8b90a0] font-medium capitalize">{data.status}</span>
                {data.health && (
                  <span className="text-[10px] text-[#8b90a0] font-mono">score: {data.health.score}/100</span>
                )}
              </div>
            )}

            {data.dependencies && data.dependencies.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Dependencies ({data.dependencies.length})</p>
                <div className="flex flex-wrap gap-1">
                  {data.dependencies.map((d) => (
                    <Badge key={d} variant="outline" className="border-[#414754] text-[10px] text-[#c1c6d7]">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.dependents && data.dependents.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Dependents ({data.dependents.length})</p>
                <div className="flex flex-wrap gap-1">
                  {data.dependents.map((d) => (
                    <Badge key={d} variant="outline" className="border-[#414754] text-[10px] text-[#c1c6d7]">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.endpoints && data.endpoints.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Endpoints ({data.endpoints.length})</p>
                <div className="space-y-1">
                  {data.endpoints.slice(0, 6).map((ep) => (
                    <div key={ep} className="flex items-center gap-1.5 text-[11px] font-mono text-[#c1c6d7] bg-[#1c1f27] rounded px-2 py-1 border border-[#414754]/50">
                      <Globe className="w-3 h-3 text-[#06b6d4]" />
                      {ep}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.databases && data.databases.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Databases</p>
                <div className="flex flex-wrap gap-1">
                  {data.databases.map((db) => (
                    <Badge key={db} variant="outline" className="border-[#f59e0b]/30 text-[10px] text-[#f59e0b]">
                      <Database className="w-3 h-3 mr-1" />{db}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.envVars && data.envVars.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Environment Variables</p>
                <div className="flex flex-wrap gap-1">
                  {data.envVars.map((env) => (
                    <Badge key={env} variant="outline" className="border-[#414754] text-[10px] text-[#c1c6d7] font-mono">{env}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.functions && data.functions.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Functions ({data.functions.length})</p>
                <div className="flex flex-wrap gap-1">
                  {data.functions.slice(0, 8).map((fn) => (
                    <Badge key={fn} variant="outline" className="border-[#414754] text-[10px] text-[#c1c6d7]">{fn}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.classes && data.classes.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Classes ({data.classes.length})</p>
                <div className="flex flex-wrap gap-1">
                  {data.classes.slice(0, 8).map((cls) => (
                    <Badge key={cls} variant="outline" className="border-[#414754] text-[10px] text-[#c1c6d7]">{cls}</Badge>
                  ))}
                </div>
              </div>
            )}

            {data.methods && data.methods.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Methods ({data.methods.length})</p>
                <div className="space-y-1">
                  {data.methods.slice(0, 8).map((m) => (
                    <div key={m.name} className="flex items-center gap-1.5 text-[11px] font-mono text-[#c1c6d7] bg-[#1c1f27] rounded px-2 py-1 border border-[#414754]/50">
                      <span className="text-[10px] text-[#8b90a0]">{m.visibility === "public" ? "+" : m.visibility === "private" ? "-" : "#"}</span>
                      <span className="text-[#e0e2ed]">{m.name}</span>
                      <span className="text-[#8b90a0]">({m.params}): {m.returnType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.properties && data.properties.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Properties ({data.properties.length})</p>
                <div className="flex flex-wrap gap-1">
                  {data.properties.slice(0, 8).map((p) => (
                    <Badge key={p.name} variant="outline" className="border-[#414754] text-[10px] text-[#c1c6d7]">
                      {p.visibility === "private" ? "- " : "+ "}{p.name}: {p.type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.deploymentConfig && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1">Deployment</p>
                <pre className="text-[10px] font-mono text-[#c1c6d7] bg-[#1c1f27] rounded p-2 border border-[#414754] whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {data.deploymentConfig}
                </pre>
              </div>
            )}

            <button
              onClick={() => onViewInKnowledgeGraph(data.id)}
              className="w-full bg-[#0070f3]/10 hover:bg-[#0070f3]/20 border border-[#0070f3]/20 text-[#0070f3] py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View in Knowledge Graph
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#0070f3]/20 bg-[#0070f3]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-[#0070f3]" />
                <p className="text-xs font-semibold text-[#e0e2ed]">AI Analysis for {data.label}</p>
              </div>
              <p className="text-xs text-[#c1c6d7] leading-relaxed">
                {aiInsight || `${data.label} is a ${data.type} component with ${data.dependencies?.length || 0} dependencies and ${data.databases?.length || 0} database connections. It exposes ${data.endpoints?.length || 0} API endpoints and operates on port ${data.port || "N/A"}.`}
              </p>
            </div>
            {data.health && data.health.issues.length > 0 && (
              <div>
                <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-1.5">Health Issues</p>
                <div className="space-y-1">
                  {data.health.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-[#c1c6d7] bg-[#1c1f27] rounded p-2 border border-[#f59e0b]/20">
                      <AlertCircle className="w-3 h-3 text-[#f59e0b] mt-0.5 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-lg border border-[#414754] p-3">
              <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold mb-2">Node Metadata</p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-[#8b90a0]">ID</span><span className="text-[#e0e2ed] font-mono">{data.id.slice(0, 20)}..</span></div>
                <div className="flex justify-between"><span className="text-[#8b90a0]">Dependency Count</span><span className="text-[#e0e2ed]">{data.dependencies?.length || 0}</span></div>
                <div className="flex justify-between"><span className="text-[#8b90a0]">Dependents</span><span className="text-[#e0e2ed]">{data.dependents?.length || 0}</span></div>
                <div className="flex justify-between"><span className="text-[#8b90a0]">Health Score</span><span className="text-[#e0e2ed]">{data.health?.score ?? "N/A"}</span></div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function ContextMenu({ x, y, nodeId, label, onClose, onInspect, onViewInKnowledgeGraph }: {
  x: number; y: number; nodeId: string; label: string; onClose: () => void;
  onInspect: () => void; onViewInKnowledgeGraph: (id: string) => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [onClose]);
  return (
    <div className="fixed z-[1000] min-w-[180px] glass-panel rounded-xl border border-[#414754] shadow-2xl py-1.5" style={{ left: x, top: y }}>
      <p className="px-3 py-1.5 text-[11px] text-[#8b90a0] font-medium border-b border-[#414754]/50 truncate">{label}</p>
      <button onClick={() => { onInspect(); onClose(); }} className="w-full px-3 py-2 text-xs text-[#e0e2ed] hover:bg-[#272a32] flex items-center gap-2 text-left transition-colors">
        <Eye className="w-3.5 h-3.5 text-[#0070f3]" /> Inspect Node
      </button>
      <button onClick={() => { onViewInKnowledgeGraph(nodeId); onClose(); }} className="w-full px-3 py-2 text-xs text-[#e0e2ed] hover:bg-[#272a32] flex items-center gap-2 text-left transition-colors">
        <ExternalLink className="w-3.5 h-3.5 text-[#8b5cf6]" /> View in Knowledge Graph
      </button>
    </div>
  );
}

const MODE_ICONS: Record<string, React.ElementType> = {
  system: Network, uml: Code2, infrastructure: Box, dataflow: GitFork, dependencies: Package,
};

export default function ArchitecturePage() {
  const [repos, setRepos] = useState<ImportedRepo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingDiagram, setLoadingDiagram] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<ModeNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ModeEdge>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; label: string } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<DiagramMode>("system");
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ data: ModeNode["data"]; position: { x: number; y: number } } | null>(null);
  const [techFilter, setTechFilter] = useState<string>("");
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set(LAYER_ORDER.map((l) => l.key)));
  const [graphStats, setGraphStats] = useState<{ totalNodes: number; uniqueNodes: number; nodeDuplicatesRemoved: number; totalEdges: number; uniqueEdges: number; edgeDuplicatesRemoved: number } | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const [analysisExists, setAnalysisExists] = useState(false);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rfInstance = useRef<any>(null);
  const fitView = useCallback((opts?: { padding?: number; duration?: number; nodes?: { id: string }[] }) =>
    rfInstance.current?.fitView(opts), []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/repositories");
        if (res.ok) {
          const data = await res.json();
          setRepos(data || []);
          if (data?.length > 0) setSelectedRepoId(data[0].id);
        }
      } catch (e) {
        console.error("Failed to load repositories:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRepoId) return;
    let cancelled = false;
    (async () => {
      setLoadingDiagram(true);
      try {
        const res = await fetch(`/api/analysis/results/${selectedRepoId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAnalysisData(data);
          setAnalysisExists(!!data.analysis);
        }
      } catch {
        console.error("Failed to fetch analysis results");
      } finally {
        if (!cancelled) setLoadingDiagram(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedRepoId]);

  const dedupNodes = useCallback((items: ModeNode[]): { nodes: ModeNode[]; removed: number } => {
    const seen = new Map<string, ModeNode>();
    let removed = 0;
    for (const item of items) {
      if (seen.has(item.id)) {
        removed++;
        const existing = seen.get(item.id)!;
        if (item.data.dependencies && !existing.data.dependencies) existing.data.dependencies = item.data.dependencies;
        if (item.data.endpoints && !existing.data.endpoints) existing.data.endpoints = item.data.endpoints;
        if (item.data.databases && !existing.data.databases) existing.data.databases = item.data.databases;
        if (item.data.functions && !existing.data.functions) existing.data.functions = item.data.functions;
        if (item.data.classes && !existing.data.classes) existing.data.classes = item.data.classes;
        if (item.data.filePath && !existing.data.filePath) existing.data.filePath = item.data.filePath;
      } else {
        seen.set(item.id, item);
      }
    }
    return { nodes: Array.from(seen.values()), removed };
  }, []);

  const dedupEdges = useCallback((items: ModeEdge[]): { edges: ModeEdge[]; removed: number } => {
    const seen = new Map<string, ModeEdge>();
    let removed = 0;
    for (const item of items) {
      if (seen.has(item.id)) removed++;
      else seen.set(item.id, item);
    }
    return { edges: Array.from(seen.values()), removed };
  }, []);

  // Build mode-specific graph from analysis data
  useEffect(() => {
    if (!analysisData) return;
    const analysis = (analysisData?.analysis as Record<string, unknown>) || null;
    if (!analysis) return;
    const services = (analysis?.services as DetectedService[]) || [];
    const apis = (analysis?.apis as DetectedApi[]) || [];
    const databases = (analysis?.databases as DetectedDatabase[]) || [];
    const modules = (analysis?.modules as DetectedModule[]) || [];
    const infra = (analysis?.infra as DetectedInfrastructure[]) || [];
    const events = (analysis?.events as DetectedEvent[]) || [];

    let modeNodes: ModeNode[] = [];
    let modeEdges: ModeEdge[] = [];

    switch (activeMode) {
      case "system":
        ({ nodes: modeNodes, edges: modeEdges } = transformSystemView(services, apis, databases, modules, events));
        break;
      case "uml":
        ({ nodes: modeNodes, edges: modeEdges } = transformUmlView(modules, services));
        break;
      case "infrastructure":
        ({ nodes: modeNodes, edges: modeEdges } = transformInfrastructureView(infra, services));
        break;
      case "dataflow":
        ({ nodes: modeNodes, edges: modeEdges } = transformDataFlowView(services, apis, events, databases));
        break;
      case "dependencies":
        ({ nodes: modeNodes, edges: modeEdges } = transformDependencyView(services, modules, events));
        break;
    }

    const { nodes: dedupedNodes, removed: nodeRemoved } = dedupNodes(modeNodes);
    const { edges: dedupedEdges, removed: edgeRemoved } = dedupEdges(modeEdges);

    let laidOut: ModeNode[];
    if (activeMode === "system") {
      laidOut = computeLayerLayout(dedupedNodes, dedupedEdges, LAYER_ORDER);
    } else {
      laidOut = computeDagreLayout(dedupedNodes, dedupedEdges, activeMode === "uml" ? "TB" : "LR");
    }

    setGraphStats({
      totalNodes: modeNodes.length, uniqueNodes: dedupedNodes.length, nodeDuplicatesRemoved: nodeRemoved,
      totalEdges: modeEdges.length, uniqueEdges: dedupedEdges.length, edgeDuplicatesRemoved: edgeRemoved,
    });
    setNodes(laidOut);
    setEdges(dedupedEdges);
    setTimeout(() => fitView({ padding: 0.3, duration: 300 }), 100);
  }, [analysisData, activeMode, setNodes, setEdges, fitView, dedupNodes, dedupEdges]);

  const handleSync = useCallback(async () => {
    if (!selectedRepoId) return;
    setSyncing(true);
    setSyncProgress({ analysisId: selectedRepoId, stage: "pending", progress: 0, status: "PENDING" });
    setError(null);
    try {
      const syncRes = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: selectedRepoId }),
      });
      if (!syncRes.ok) {
        setSyncing(false);
        const body = await syncRes.json().catch(() => ({ error: "Sync failed" }));
        setError(body.error || "Failed to start analysis");
        return;
      }
    } catch (err) {
      setSyncing(false);
      setError(err instanceof Error ? err.message : "Failed to start analysis");
      return;
    }
    const es = new EventSource(`/api/analysis/progress/${selectedRepoId}`);
    es.onmessage = (event) => {
      try {
        const progress: AnalysisProgress = JSON.parse(event.data);
        setSyncProgress(progress);
        if (progress.status === "COMPLETED") {
          es.close(); setSyncing(false);
          fetch(`/api/analysis/results/${selectedRepoId}`)
            .then((r) => r.json())
            .then((data) => { setAnalysisData(data); setAnalysisExists(true); })
            .catch((e) => console.error("Failed to fetch analysis results:", e));
        } else if (progress.status === "FAILED") {
          es.close(); setSyncing(false);
          setError(progress.error || "Analysis failed");
        }
      } catch { console.error("Failed to process SSE progress event"); }
    };
    es.onerror = () => { es.close(); setSyncing(false); };
  }, [selectedRepoId]);

  const buildInspectorData = useCallback((node: ModeNode): InspectorData => {
    const analysis = (analysisData?.analysis as Record<string, unknown>) || null;
    const services = (analysis?.services as DetectedService[]) || [];
    const apis = (analysis?.apis as DetectedApi[]) || [];
    const service = services.find((s) => `service-${s.name}` === node.id || s.name === node.data.label);
    const serviceEndpoints = service
      ? apis.filter((a) => a.serviceName === service.name).map((a) => `${a.method} ${a.path}`)
      : [];
    const serviceDbs = service?.databases || node.data.databases || [];
    const { status, label: statusLabel } = computeStatus(node.data);
    return {
      id: node.id, label: node.data.label, type: node.data.nodeType,
      technology: service?.technology || node.data.technology || "",
      description: node.data.description || service?.description || "",
      layer: node.data.layer || node.data.nodeType,
      filePath: node.data.filePath || service?.sourcePath,
      functions: node.data.functions, classes: node.data.classes,
      dependencies: node.data.dependencies || service?.dependencies,
      dependents: node.data.dependents,
      endpoints: serviceEndpoints.length > 0 ? serviceEndpoints : undefined,
      databases: serviceDbs, envVars: node.data.envVars || service?.envVars,
      port: node.data.port || service?.port,
      status: statusLabel,
      health: node.data.health || (status === "warning" ? { score: 60, issues: [] } : undefined),
      deploymentConfig: node.data.deploymentConfig,
      methods: node.data.methods, properties: node.data.properties,
      extends: node.data.extends, implements: node.data.implements,
      serviceData: service,
    };
  }, [analysisData]);

  const onNodeClick: NodeMouseHandler<ModeNode> = useCallback((_, node) => {
    setContextMenu(null);
    const data = buildInspectorData(node);
    setInspectorData((prev) => (prev?.id === node.id ? null : data));
  }, [buildInspectorData]);

  const onNodeDoubleClick: NodeMouseHandler<ModeNode> = useCallback((_, node) => {
    setContextMenu(null);
    fitView({ nodes: [{ id: node.id }], padding: 0.3, duration: 400 });
  }, [fitView]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: ModeNode) => {
    event.preventDefault();
    setInspectorData(null);
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, label: node.data.label });
  }, []);

  const onPaneClick = useCallback(() => { setContextMenu(null); setInspectorData(null); }, []);

  const onSelectionDrag = useCallback((_event: unknown, nodes: ModeNode[]) => {
    if (nodes.length > 0) {
      setInspectorData(buildInspectorData(nodes[0] as ModeNode));
    }
  }, [buildInspectorData]);

  const viewInKnowledgeGraph = useCallback((nodeId: string) => {
    window.open(`/dashboard/knowledge-graph?node=${nodeId}`, "_blank");
  }, []);

  const toggleFullscreen = useCallback(() => setFullscreen((f) => !f), []);
  const zoomIn = useCallback(() => rfInstance.current?.zoomIn({ duration: 200 }), []);
  const zoomOut = useCallback(() => rfInstance.current?.zoomOut({ duration: 200 }), []);
  const resetView = useCallback(() => rfInstance.current?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 }), []);
  const toggleLayer = useCallback((layerKey: string) => {
    setExpandedLayers((prev) => { const next = new Set(prev); if (next.has(layerKey)) next.delete(layerKey); else next.add(layerKey); return next; });
  }, []);

  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: ModeNode) => {
    setHoveredNode({ data: node.data, position: { x: _event.clientX, y: _event.clientY } });
  }, []);
  const onNodeMouseLeave = useCallback(() => setHoveredNode(null), []);

  const filteredNodes = useMemo(() => {
    let result = nodes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) =>
        n.data.label?.toLowerCase().includes(q) || n.data.description?.toLowerCase().includes(q) || n.data.technology?.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "services") {
      result = result.filter((n) => ["frontend", "backend", "service"].includes(n.data.nodeType));
    } else if (activeFilter === "infrastructure") {
      result = result.filter((n) => ["infrastructure", "database", "queue"].includes(n.data.nodeType));
    } else if (activeFilter === "dependencies") {
      result = result.filter((n) => n.data.dependencyCount > 0 || (n.data.dependencies?.length || 0) > 0);
    }
    if (techFilter) {
      result = result.filter((n) => n.data.technology?.toLowerCase().includes(techFilter.toLowerCase()));
    }
    return result;
  }, [nodes, searchQuery, activeFilter, techFilter]);

  const filteredEdges = useMemo(() => {
    if (activeFilter === "services" || activeFilter === "infrastructure") {
      const validIds = new Set(filteredNodes.map((n) => n.id));
      return edges.filter((e) => validIds.has(e.source) && validIds.has(e.target));
    }
    return edges;
  }, [edges, filteredNodes, activeFilter]);

  const analysis = (analysisData?.analysis as Record<string, unknown>) || null;
  const services = (analysis?.services as DetectedService[]) || [];
  const apis = (analysis?.apis as DetectedApi[]) || [];
  const databases = (analysis?.databases as DetectedDatabase[]) || [];
  const dependencies = (analysis?.dependencies as Array<unknown>) || [];
  const filesCount = (analysis?.files as Array<unknown>)?.length || 0;
  const modules = (analysis?.modules as DetectedModule[]) || [];
  const infra = (analysis?.infra as DetectedInfrastructure[]) || [];
  const events = (analysis?.events as DetectedEvent[]) || [];
  const aiAnalysis = (analysis?.aiAnalysis as AiAnalysisData) || null;

  const servicesCount = services.length;
  const apisCount = apis.length;
  const databasesCount = databases.length;
  const dependenciesCount = dependencies.length;
  const modulesCount = modules.length;
  const edgeCount = filteredEdges.length;
  const nodeCount = filteredNodes.length;

  const completedSteps = syncProgress
    ? LIVE_STEPS.filter((s) => {
        const order = LIVE_STEPS.map((x) => x.key);
        const currentIdx = order.indexOf(syncProgress.stage);
        const stepIdx = order.indexOf(s.key);
        return stepIdx < currentIdx || (stepIdx === currentIdx && syncProgress.progress >= 100);
      }).map((s) => s.key)
    : [];

  const getAiInsightForNode = useCallback((nodeId: string): string | undefined => {
    if (!aiAnalysis?.services) return undefined;
    const label = nodes.find((n) => n.id === nodeId)?.data?.label;
    if (!label) return undefined;
    const svcInsight = aiAnalysis.services[label as keyof typeof aiAnalysis.services] as string | undefined;
    return svcInsight || undefined;
  }, [aiAnalysis, nodes]);

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col gap-3">
        {/* Mode navigation tabs */}
        {analysisExists && (
          <Tabs
            value={activeMode}
            onValueChange={(v) => { setActiveMode(v as DiagramMode); setInspectorData(null); }}
            className="w-full"
          >
            <TabsList className="bg-[#1c1f27] border border-[#414754] p-1 w-full justify-start gap-0.5 h-10">
              {DIAGRAM_MODES.map((mode) => {
                const Icon = MODE_ICONS[mode.id] || Network;
                const isActive = activeMode === mode.id;
                return (
                  <TabsTrigger
                    key={mode.id}
                    value={mode.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md transition-all data-[state=active]:bg-[#0070f3]/15 data-[state=active]:text-[#0070f3] data-[state=active]:shadow-none text-[#8b90a0] hover:text-[#e0e2ed]`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
            <SelectTrigger className="w-[200px] border-[#414754] bg-[#1c1f27] text-[#e0e2ed] h-9 text-xs">
              <SelectValue placeholder="Select repository..." />
            </SelectTrigger>
            <SelectContent>
              {repos.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-[160px]">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b90a0]" />
            <Input
              placeholder="Search nodes..."
              className="pl-7 h-9 text-xs border-[#414754] bg-[#1c1f27] text-[#e0e2ed]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {!analysisExists && !syncing && (
            <Button onClick={handleSync} size="sm" className="bg-[#0070f3] hover:bg-[#0060d3] h-9 text-xs">
              <Play className="mr-1.5 h-3.5 w-3.5" /> Run Analysis
            </Button>
          )}
          {analysisExists && !syncing && (
            <Button onClick={handleSync} size="sm" variant="outline" className="border-[#414754] text-[#e0e2ed] hover:bg-[#272a32] h-9 text-xs">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Re-analyze
            </Button>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="outline" className="border-[#414754] text-[10px] text-[#8b90a0] hidden md:inline-flex">
              {nodeCount} nodes / {edgeCount} edges
            </Badge>

            {analysisExists && (
              <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-[#414754] bg-[#1c1f27] p-0.5">
                <button onClick={zoomIn} className="p-1.5 rounded hover:bg-[#272a32] text-[#8b90a0] hover:text-[#e0e2ed]" title="Zoom In">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOut} className="p-1.5 rounded hover:bg-[#272a32] text-[#8b90a0] hover:text-[#e0e2ed]" title="Zoom Out">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => fitView({ padding: 0.3, duration: 300 })} className="p-1.5 rounded hover:bg-[#272a32] text-[#8b90a0] hover:text-[#e0e2ed]" title="Fit to Screen">
                  <Maximize className="w-3.5 h-3.5" />
                </button>
                <button onClick={resetView} className="p-1.5 rounded hover:bg-[#272a32] text-[#8b90a0] hover:text-[#e0e2ed]" title="Reset View">
                  <Minimize className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {analysisExists && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setAiOpen(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-[#0070f3]/10 text-[#0070f3] border border-[#0070f3]/20 hover:bg-[#0070f3]/20 transition-all"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">AI Insights</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1c1f27] border-[#414754] text-[#e0e2ed] text-xs">
                      AI-powered architecture analysis
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#414754] text-[#8b90a0] hover:text-[#e0e2ed] hover:bg-[#272a32] transition-all"
                  title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {fullscreen ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        {analysisExists && (
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {[
              { id: "all", label: "All Layers", icon: Layers },
              { id: "services", label: "Services", icon: Server },
              { id: "infrastructure", label: "Infrastructure", icon: Box },
              { id: "dependencies", label: "Dependencies", icon: Network },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-[#0070f3]/10 text-[#0070f3] border border-[#0070f3]/20"
                      : "text-[#8b90a0] hover:text-[#e0e2ed] hover:bg-[#272a32]/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}

            <div className="w-px h-5 bg-[#414754] mx-1 self-center" />

            {LAYER_ORDER.map((layer) => {
              const expanded = expandedLayers.has(layer.key);
              return (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key)}
                  className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                    expanded ? "text-[#e0e2ed] hover:bg-[#272a32]/50" : "text-[#414754] hover:text-[#8b90a0]"
                  }`}
                  title={expanded ? `Collapse ${layer.label}` : `Expand ${layer.label}`}
                >
                  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span className="hidden sm:inline">{layer.label}</span>
                </button>
              );
            })}

            {graphStats && (graphStats.nodeDuplicatesRemoved > 0 || graphStats.edgeDuplicatesRemoved > 0) && (
              <>
                <div className="w-px h-5 bg-[#414754] mx-1 self-center" />
                <button
                  onClick={() => setShowDiagnostics((v) => !v)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg text-yellow-400 border border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/10 transition-all"
                  title="Graph health"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{graphStats.nodeDuplicatesRemoved + graphStats.edgeDuplicatesRemoved} duplicates</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Graph Diagnostics */}
        {analysisExists && showDiagnostics && graphStats && (
          <div className="rounded-lg border border-[#414754] bg-[#1c1f27]/50 p-3 text-[11px]">
            <p className="font-semibold text-[#e0e2ed] mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Graph Diagnostics
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="rounded border border-[#414754]/50 p-2"><p className="text-[9px] text-[#8b90a0]">Total Nodes</p><p className="text-sm font-mono text-[#e0e2ed]">{graphStats.totalNodes}</p></div>
              <div className="rounded border border-[#414754]/50 p-2"><p className="text-[9px] text-[#8b90a0]">Unique Nodes</p><p className="text-sm font-mono text-[#22c55e]">{graphStats.uniqueNodes}</p></div>
              <div className="rounded border border-[#414754]/50 p-2"><p className="text-[9px] text-[#8b90a0]">Duplicates Removed</p><p className="text-sm font-mono text-[#f59e0b]">{graphStats.nodeDuplicatesRemoved}</p></div>
              <div className="rounded border border-[#414754]/50 p-2"><p className="text-[9px] text-[#8b90a0]">Total Edges</p><p className="text-sm font-mono text-[#e0e2ed]">{graphStats.totalEdges}</p></div>
              <div className="rounded border border-[#414754]/50 p-2"><p className="text-[9px] text-[#8b90a0]">Unique Edges</p><p className="text-sm font-mono text-[#22c55e]">{graphStats.uniqueEdges}</p></div>
              <div className="rounded border border-[#414754]/50 p-2"><p className="text-[9px] text-[#8b90a0]">Duplicates Removed</p><p className="text-sm font-mono text-[#f59e0b]">{graphStats.edgeDuplicatesRemoved}</p></div>
            </div>
          </div>
        )}

        {/* Advanced filters */}
        {analysisExists && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3 h-3 text-[#8b90a0] shrink-0" />
            <input
              placeholder="Filter by technology..."
              className="h-7 text-[11px] rounded-lg border border-[#414754] bg-[#1c1f27] text-[#e0e2ed] px-2 max-w-[160px] outline-none focus:border-[#0070f3]/50 transition-all"
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 px-4 py-2.5 text-xs text-[#ffb4ab] flex items-center justify-between">
            <span><AlertCircle className="inline h-3.5 w-3.5 mr-1.5" />{error}</span>
            <button className="underline ml-2" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {/* Live progress bar */}
        {syncing && syncProgress && (
          <div className="rounded-lg border border-[#414754] bg-[#1c1f27]/50 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {syncProgress.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : syncProgress.status === "FAILED" ? (
                  <XCircle className="h-4 w-4 text-[#ffb4ab]" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-[#0070f3]" />
                )}
                <span className="text-xs font-medium text-[#e0e2ed]">
                  {STAGE_LABELS[syncProgress.stage] || syncProgress.stage}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8b90a0]">{syncProgress.progress}%</span>
            </div>
            <Progress value={syncProgress.progress} className="h-1.5" />
            <div className="flex gap-3 mt-2">
              {LIVE_STEPS.map((step) => {
                const done = completedSteps.includes(step.key);
                const current = syncProgress.stage === step.key;
                return (
                  <div key={step.key} className={`flex items-center gap-1 text-[9px] ${done ? "text-green-400" : current ? "text-[#0070f3]" : "text-[#414754]"}`}>
                    {done ? <CheckCircle2 className="w-2.5 h-2.5" /> : current ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full border border-[#414754]" />}
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats bar */}
        {analysisExists && analysis && (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { label: "Services", value: servicesCount, icon: Server, color: "#06b6d4" },
              { label: "APIs", value: apisCount, icon: Globe, color: "#3b82f6" },
              { label: "Databases", value: databasesCount, icon: Database, color: "#f59e0b" },
              { label: "Dependencies", value: dependenciesCount, icon: Package, color: "#8b5cf6" },
              { label: "Modules", value: modulesCount, icon: Box, color: "#10b981" },
              { label: "Files", value: filesCount, icon: FileText, color: "#6b7280" },
              { label: "Nodes", value: nodeCount, icon: Network, color: "#06b6d4" },
              ...(aiAnalysis?.architectureStyle
                ? [{ label: "Style", value: aiAnalysis.architectureStyle, icon: Layers, color: "#0070f3" }]
                : [{ label: "Edges", value: edgeCount, icon: BarChart3, color: "#6366f1" }]),
            ].map((stat) => (
              <div key={stat.label} className="glass-panel rounded-xl p-2.5 hover:border-[#0070f3]/20 transition-all">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                  <p className="text-[9px] text-[#8b90a0] font-medium">{stat.label}</p>
                </div>
                <p className="text-sm font-bold text-[#e0e2ed] font-mono">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main canvas with Three.js background */}
        <div className={`flex gap-3 min-h-0 ${fullscreen ? "fixed inset-0 z-50 bg-[#10131b] p-4" : "flex-1"}`}>
          <div className={`relative rounded-xl overflow-hidden glass-panel ${fullscreen ? "flex-1" : "flex-1"}`}>
            <ThreeBackground />
            {analysisExists ? (
              <ReactFlow
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onNodeContextMenu={onNodeContextMenu}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                onPaneClick={onPaneClick}
                onSelectionDrag={onSelectionDrag}
                onInit={(instance) => { rfInstance.current = instance; }}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.05}
                maxZoom={8}
                selectionOnDrag
                panOnDrag={[1, 2]}
                selectNodesOnDrag
                defaultEdgeOptions={{
                  type: "smoothstep", animated: true,
                  style: { stroke: "#6366f1", strokeWidth: 2 },
                  markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: "#6366f1" },
                }}
                proOptions={{ hideAttribution: true }}
                zoomOnScroll
                panOnScroll={false}
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={0.8} color="#272a32" />
                <Controls
                  className="glass-panel rounded-lg border-[#414754] [&>button]:border-[#414754] [&>button]:text-[#8b90a0] [&>button]:hover:bg-[#272a32]"
                  showInteractive={false}
                />
                <MiniMap
                  nodeColor={(nd) => NODE_COLORS[(nd.data as ModeNode["data"])?.nodeType] || "#272a32"}
                  maskColor="rgba(16,19,27,0.85)"
                  className="glass-panel rounded-lg border-[#414754]"
                  style={{ width: 160, height: 100 }}
                />
              </ReactFlow>
            ) : loading || (loadingDiagram && !analysisData) ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[#8b90a0]" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#272a32]">
                    <Server className="h-8 w-8 text-[#8b90a0]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#e0e2ed] mb-1">No Architecture Data</h3>
                  <p className="text-xs text-[#8b90a0] mb-5">
                    Select a repository and run analysis to see real architecture diagrams, dependency graphs, and AI-powered tech stack detection.
                  </p>
                  <Button onClick={handleSync} className="bg-[#0070f3] hover:bg-[#0060d3] text-xs h-9">
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Run Analysis
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Deep Inspector Panel */}
          {analysisExists && inspectorData && (
            <DeepInspectorPanel
              data={inspectorData}
              onClose={() => setInspectorData(null)}
              onViewInKnowledgeGraph={viewInKnowledgeGraph}
              aiInsight={getAiInsightForNode(inspectorData.id)}
            />
          )}
        </div>

        {/* Architecture Timeline */}
        {analysisExists && (
          <footer className="glass-panel rounded-xl overflow-hidden flex flex-col shrink-0">
            <div className="px-4 py-2 border-b border-[#414754]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0070f3]" />
                <h4 className="font-bold text-xs text-[#e0e2ed]">Architecture Timeline</h4>
              </div>
              <div className="text-[10px] text-[#8b90a0] font-mono">
                Last analyzed:{" "}
                <span className="text-[#e0e2ed]">
                  {repos.find((r) => r.id === selectedRepoId)?.lastSyncedAt
                    ? new Date(repos.find((r) => r.id === selectedRepoId)!.lastSyncedAt!).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex items-center px-6 py-2.5 relative">
              <div className="absolute left-6 right-6 h-[2px] bg-[#414754]/50 rounded-full" />
              <div className="flex-1 flex justify-between relative">
                {[
                  { label: "Created", active: true }, { label: "Imported", active: true },
                  { label: "Analyzed", active: true }, { label: "Latest", active: true },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col items-center relative cursor-pointer hover:opacity-80">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 z-10 -mt-1 ${m.active ? "bg-[#0070f3] border-[#0070f3]" : "bg-[#1c1f27] border-[#414754]"}`} />
                    <span className={`mt-1 font-mono text-[8px] ${m.active ? "text-[#0070f3] font-semibold" : "text-[#8b90a0]"}`}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} nodeId={contextMenu.nodeId} label={contextMenu.label}
          onClose={() => setContextMenu(null)}
          onInspect={() => {
            const node = nodes.find((n) => n.id === contextMenu.nodeId);
            if (node) setInspectorData(buildInspectorData(node));
          }}
          onViewInKnowledgeGraph={viewInKnowledgeGraph}
        />
      )}

      {/* Hover Tooltip */}
      {hoveredNode && !contextMenu && !inspectorData && (
        <div
          className="fixed z-[999] pointer-events-none glass-panel rounded-xl border border-[#414754] shadow-2xl px-3 py-2 max-w-[200px]"
          style={{ left: hoveredNode.position.x + 12, top: hoveredNode.position.y - 10 }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NODE_COLORS[hoveredNode.data.nodeType] || "#6b7280" }} />
            <p className="text-xs font-bold text-[#e0e2ed] truncate">{hoveredNode.data.label}</p>
          </div>
          <p className="text-[10px] text-[#8b90a0] truncate">{hoveredNode.data.nodeType}{hoveredNode.data.technology ? ` · ${hoveredNode.data.technology}` : ""}</p>
          {hoveredNode.data.description && (
            <p className="text-[9px] text-[#8b90a0] mt-0.5 line-clamp-2">{hoveredNode.data.description}</p>
          )}
        </div>
      )}

      {/* AI Insights Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl bg-[#10131b] border-[#414754] text-[#e0e2ed]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              AI Architecture Insights
            </DialogTitle>
            <DialogDescription className="text-[#8b90a0]">
              AI-powered analysis of your repository architecture
            </DialogDescription>
          </DialogHeader>
          {aiAnalysis && (
            <ScrollArea className="max-h-[70vh] scrollbar-thin">
              <div className="space-y-5 pr-4">
                {aiAnalysis.summary && (
                  <div className="rounded-lg border border-[#414754] bg-[#1c1f27]/30 p-4">
                    <p className="text-xs font-medium text-[#8b90a0] mb-2 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Architecture Summary
                    </p>
                    <p className="text-sm text-[#c1c6d7] leading-relaxed">{aiAnalysis.summary}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {aiAnalysis.architectureStyle && (
                    <div className="rounded-lg border border-[#414754] p-3">
                      <p className="text-[10px] text-[#8b90a0] mb-1 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" /> Architecture Style
                      </p>
                      <p className="text-sm font-semibold text-[#e0e2ed]">{aiAnalysis.architectureStyle}</p>
                    </div>
                  )}
                  {aiAnalysis.complexity && (
                    <div className="rounded-lg border border-[#414754] p-3">
                      <p className="text-[10px] text-[#8b90a0] mb-1 flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" /> Complexity
                      </p>
                      <p className="text-sm font-semibold text-[#e0e2ed]">{aiAnalysis.complexity}</p>
                    </div>
                  )}
                </div>
                {aiAnalysis.patterns && aiAnalysis.patterns.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#8b90a0] mb-2">Detected Architecture Patterns</p>
                    <div className="space-y-2">
                      {aiAnalysis.patterns.map((p, i) => (
                        <div key={i} className="rounded-lg border border-[#414754] bg-[#1c1f27]/20 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-[#e0e2ed]">{p.pattern}</p>
                            <Badge variant="outline" className="border-[#414754] text-[10px]">{Math.round(p.confidence * 100)}% confidence</Badge>
                          </div>
                          <p className="text-xs text-[#8b90a0]">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-[#8b90a0] mb-2">Recommendations</p>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[#c1c6d7]">
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

      {/* FAB Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        <button
          onClick={() => fitView({ padding: 0.3, duration: 300 })}
          className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[#e0e2ed] hover:bg-[#0070f3] transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        {analysisExists && (
          <button
            onClick={() => setAiOpen(true)}
            className="w-9 h-9 rounded-full bg-[#0070f3] text-white flex items-center justify-center shadow-lg hover:bg-[#0060d3] transition-all active:scale-95"
            style={{ boxShadow: "0 0 20px rgba(0,112,243,0.4)" }}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
