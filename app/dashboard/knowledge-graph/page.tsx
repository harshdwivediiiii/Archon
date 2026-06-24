"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Search, ExternalLink, ArrowRight, Loader2,
  GitBranch, Database,
} from "lucide-react";

interface KnowledgeNodeData {
  id: string;
  label: string;
  type: string;
  description: string | null;
  connections: string[];
  technology?: string;
  filePath?: string;
  [key: string]: unknown;
}

interface KnowledgeEdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  type: string;
}

const NODE_TYPE_COLORS: Record<string, { primary: string; bg: string; border: string }> = {
  service: { primary: "#06b6d4", bg: "rgba(6,182,212,0.06)", border: "rgba(6,182,212,0.3)" },
  database: { primary: "#ec4899", bg: "rgba(236,72,153,0.06)", border: "rgba(236,72,153,0.3)" },
  infrastructure: { primary: "#8b5cf6", bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.3)" },
  frontend: { primary: "#3b82f6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.3)" },
  api: { primary: "#0d9488", bg: "rgba(13,148,136,0.06)", border: "rgba(13,148,136,0.3)" },
  queue: { primary: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.3)" },
  module: { primary: "#10b981", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.3)" },
  file: { primary: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.3)" },
  default: { primary: "#6366f1", bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.3)" },
};

const EDGE_PROTOCOL_COLORS: Record<string, string> = {
  depends: "#6366f1",
  imports: "#8b5cf6",
  connects: "#06b6d4",
  contains: "#f59e0b",
  runs: "#10b981",
  calls: "#3b82f6",
  default: "#2a2d35",
};

interface FlowNode extends Node {
  data: KnowledgeNodeData;
}

function KnowledgeGraphNode({ data, selected }: { data: KnowledgeNodeData; selected?: boolean }) {
  const colors = NODE_TYPE_COLORS[data.type] || NODE_TYPE_COLORS.default;

  return (
    <div
      className="rounded-xl px-4 py-3 transition-all min-w-[180px]"
      style={{
        background: colors.bg,
        border: `1.5px solid ${selected ? colors.primary : colors.border}`,
        boxShadow: selected ? `0 0 0 1px ${colors.primary}30` : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${colors.primary}15`,
            width: 28,
            height: 28,
          }}
        >
          <Database className="w-3.5 h-3.5" style={{ color: colors.primary }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{data.label}</p>
          <p className="text-[10px] text-[#8b90a0] truncate">{data.type}</p>
        </div>
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: colors.primary }}
        />
      </div>
      {data.description && (
        <p className="mt-1 text-[10px] text-[#6b7280] leading-relaxed line-clamp-2">{data.description}</p>
      )}
    </div>
  );
}

const nodeTypes = { default: KnowledgeGraphNode };

export default function KnowledgeGraphPage() {
  const [rawNodes, setRawNodes] = useState<KnowledgeNodeData[]>([]);
  const [rawEdges, setRawEdges] = useState<KnowledgeEdgeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const wsRes = await fetch("/api/workspace");
        if (cancelled) return;
        const wsData = await wsRes.json();
        const workspaceId = wsData?.id;
        if (workspaceId) {
          const graphRes = await fetch(`/api/graph?workspaceId=${workspaceId}`);
          if (!cancelled && graphRes.ok) {
            const graphData = await graphRes.json();
            if (graphData.nodes) setRawNodes(graphData.nodes);
            if (graphData.edges) setRawEdges(graphData.edges);
          }
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

  const filteredNodeIds = useMemo(() => {
    if (!searchQuery) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(
      rawNodes
        .filter((n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [rawNodes, searchQuery]);

  const transformed = useMemo(() => {
    const flowNodes: FlowNode[] = rawNodes.map((n, i) => {
      const angle = (i / rawNodes.length) * Math.PI * 2;
      const radius = Math.min(300 + rawNodes.length * 8, 800);
      const cx = Math.cos(angle) * radius;
      const cy = Math.sin(angle) * radius * 0.6;
      return {
        id: n.id,
        type: "default",
        position: { x: cx + 400, y: cy + 250 },
        data: n,
      };
    });

    const flowEdges: Edge[] = rawEdges.map((e) => {
      const edgeColor = EDGE_PROTOCOL_COLORS[e.type] || EDGE_PROTOCOL_COLORS.default;
      return {
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: "smoothstep",
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 1.5, opacity: 0.5 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: edgeColor },
        label: e.label || "",
        labelStyle: { fill: "#8b90a0", fontSize: 9, fontWeight: 500 },
      };
    });

    return { flowNodes, flowEdges };
  }, [rawNodes, rawEdges]);

  useEffect(() => {
    if (transformed.flowNodes.length > 0) {
      setNodes(transformed.flowNodes);
      setEdges(transformed.flowEdges);
    }
  }, [transformed, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback((_, node) => {
    setSelectedNode(node.data);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.filter((n) => filteredNodeIds.has(n.id));
  }, [nodes, searchQuery, filteredNodeIds]);

  const filteredEdges = useMemo(() => {
    if (!searchQuery) return edges;
    const validIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => validIds.has(e.source) && validIds.has(e.target));
  }, [edges, searchQuery, filteredNodes]);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
            <p className="text-zinc-400">Semantic network of your repository architecture</p>
          </div>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3 relative rounded-xl overflow-hidden" style={{
            background: "rgba(10,10,10,0.6)",
            border: "1px solid rgba(42,45,53,0.4)",
          }}>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
                    <GitBranch className="h-8 w-8 text-blue-400" />
                  </div>
                  <p className="text-sm text-zinc-400">No knowledge graph data yet</p>
                  <p className="mt-1 text-xs text-zinc-600">Import a repository to generate a knowledge graph</p>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={filteredNodes}
                edges={filteredEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={6}
                attributionPosition="bottom-left"
                panOnDrag={[1, 2]}
                selectNodesOnDrag
                zoomOnScroll
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={0.5} color="#1a1d24" />
                <Controls className="!bg-transparent !border-0 [&>button]:!bg-[#0a0a0a] [&>button]:!border [&>button]:!border-[#2a2d35]" showInteractive={false} />
                <MiniMap
                  nodeColor={(nd) => {
                    const d = nd.data as KnowledgeNodeData;
                    return NODE_TYPE_COLORS[d.type]?.primary || "#2a2d35";
                  }}
                  maskColor="rgba(10,10,10,0.85)"
                  className="!rounded-lg"
                  style={{ width: 140, height: 90, border: "1px solid rgba(42,45,53,0.4)" }}
                />
              </ReactFlow>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-lg p-3" style={{
              background: "rgba(10,10,10,0.6)",
              border: "1px solid rgba(42,45,53,0.4)",
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <p className="text-xs font-semibold text-white">Node Explorer</p>
              </div>
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs border-[#2a2d35] bg-[#12141a] text-white"
              />
            </div>

            <div className="flex-1 rounded-lg p-3" style={{
              background: "rgba(10,10,10,0.6)",
              border: "1px solid rgba(42,45,53,0.4)",
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white">Nodes</p>
                <Badge variant="outline" className="border-[#2a2d35] text-[10px]">{rawNodes.length}</Badge>
              </div>
              <ScrollArea className="h-[300px] pr-2 scrollbar-thin">
                <div className="space-y-1.5">
                  {rawNodes.length === 0 && !loading && (
                    <p className="text-xs text-zinc-500">No nodes found</p>
                  )}
                  {rawNodes.map((node) => {
                    const colors = NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.default;
                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          setSearchQuery("");
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left transition-all"
                        style={{
                          background: selectedNode?.id === node.id ? `${colors.primary}10` : "transparent",
                          border: `1px solid ${selectedNode?.id === node.id ? colors.border : "transparent"}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: colors.primary }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white truncate">{node.label}</p>
                            <p className="text-[10px] text-zinc-500 capitalize truncate">{node.type}</p>
                          </div>
                          <Badge variant="outline" className="border-[#2a2d35] text-[9px]">
                            {node.connections.length}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="rounded-lg p-4" style={{
            background: "rgba(10,10,10,0.6)",
            border: "1px solid rgba(42,45,53,0.4)",
          }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="rounded-lg p-2.5"
                  style={{
                    background: `${(NODE_TYPE_COLORS[selectedNode.type] || NODE_TYPE_COLORS.default).primary}15`,
                  }}
                >
                  <Database className="w-5 h-5" style={{ color: (NODE_TYPE_COLORS[selectedNode.type] || NODE_TYPE_COLORS.default).primary }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{selectedNode.label}</h3>
                  <p className="text-xs capitalize text-zinc-400">{selectedNode.type}</p>
                  {selectedNode.description && (
                    <p className="mt-0.5 text-xs text-zinc-500">{selectedNode.description}</p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-[#2a2d35] text-xs h-8">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open in Architecture
              </Button>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-medium text-zinc-400 mb-2">Connected Nodes</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.connections.map((connId) => {
                  const conn = rawNodes.find((n) => n.id === connId);
                  return conn ? (
                    <button
                      key={conn.id}
                      onClick={() => setSelectedNode(conn)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-all"
                      style={{
                        background: `${(NODE_TYPE_COLORS[conn.type] || NODE_TYPE_COLORS.default).primary}12`,
                        border: `1px solid ${(NODE_TYPE_COLORS[conn.type] || NODE_TYPE_COLORS.default).border}`,
                        color: (NODE_TYPE_COLORS[conn.type] || NODE_TYPE_COLORS.default).primary,
                      }}
                    >
                      <ArrowRight className="w-2.5 h-2.5" />
                      {conn.label}
                    </button>
                  ) : null;
                })}
                {selectedNode.connections.length === 0 && (
                  <p className="text-xs text-zinc-500">No direct connections</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
