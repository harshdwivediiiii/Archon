"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Search, GitBranch, Network, ExternalLink, ArrowRight, Cpu, Loader2 } from "lucide-react";

interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  description: string | null;
  connections: string[];
}

interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  type: string;
}

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
            if (graphData.nodes) setNodes(graphData.nodes);
            if (graphData.edges) setEdges(graphData.edges);
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

  const filteredNodes = nodes.filter((n) =>
    n.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
            <p className="text-zinc-400">Explore system relationships and dependencies</p>
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="h-full p-6">
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
                    <p className="mt-1 text-xs text-zinc-600">
                      Import a repository to generate a knowledge graph
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {filteredNodes.map((node) => (
                      <Badge
                        key={node.id}
                        variant={selectedNode?.id === node.id ? "default" : "secondary"}
                        className={`cursor-pointer gap-1.5 px-3 py-1.5 ${
                          node.type === "service"
                            ? "border-blue-600/30"
                            : node.type === "database"
                              ? "border-purple-600/30"
                              : "border-emerald-600/30"
                        }`}
                        onClick={() => setSelectedNode(node)}
                      >
                        <Network className="h-3 w-3" />
                        {node.label}
                        <span className="ml-1 text-xs opacity-60">({node.connections.length})</span>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex-1 rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
                    <svg className="h-full w-full" viewBox="0 0 800 500">
                      {edges.map((edge) => {
                        const source = nodes.find((n) => n.id === edge.sourceId);
                        const target = nodes.find((n) => n.id === edge.targetId);
                        if (!source || !target) return null;
                        const sx = 400 + Math.sin(nodes.indexOf(source) * 1.5) * 200;
                        const sy = 250 + Math.cos(nodes.indexOf(source) * 1.5) * 150;
                        const tx = 400 + Math.sin(nodes.indexOf(target) * 1.5) * 200;
                        const ty = 250 + Math.cos(nodes.indexOf(target) * 1.5) * 150;
                        return (
                          <line
                            key={edge.id}
                            x1={sx}
                            y1={sy}
                            x2={tx}
                            y2={ty}
                            stroke="#27272a"
                            strokeWidth={1.5}
                          />
                        );
                      })}
                      {filteredNodes.map((node, i) => {
                        const cx = 400 + Math.sin(i * 1.5) * 200;
                        const cy = 250 + Math.cos(i * 1.5) * 150;
                        return (
                          <g
                            key={node.id}
                            onClick={() => setSelectedNode(node)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={cx}
                              cy={cy}
                              r={24}
                              fill={
                                selectedNode?.id === node.id ? "#3b82f6" :
                                node.type === "service" ? "#1e3a5f" :
                                node.type === "database" ? "#3b0764" : "#064e3b"
                              }
                              stroke={
                                selectedNode?.id === node.id ? "#60a5fa" :
                                node.type === "service" ? "#3b82f6" :
                                node.type === "database" ? "#a855f7" : "#34d399"
                              }
                              strokeWidth={2}
                            />
                            <text
                              x={cx}
                              y={cy + 40}
                              textAnchor="middle"
                              fill="#a1a1aa"
                              fontSize={11}
                            >
                              {node.label.length > 15 ? node.label.slice(0, 14) + "..." : node.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4 text-zinc-400" />
                Node Explorer
              </CardTitle>
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="flex-1">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredNodes.length === 0 && !loading && (
                    <p className="text-sm text-zinc-500">No nodes found</p>
                  )}
                  {filteredNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedNode?.id === node.id
                          ? "border-blue-600 bg-blue-600/10"
                          : "border-zinc-800 hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-1.5 ${
                            node.type === "service"
                              ? "bg-blue-600/10"
                              : node.type === "database"
                                ? "bg-purple-600/10"
                                : "bg-emerald-600/10"
                          }`}
                        >
                          <Network
                            className={`h-4 w-4 ${
                              node.type === "service"
                                ? "text-blue-400"
                                : node.type === "database"
                                  ? "text-purple-400"
                                  : "text-emerald-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{node.label}</p>
                          <p className="text-xs capitalize text-zinc-500">{node.type}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {node.connections.length} edges
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {selectedNode && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <Cpu className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedNode.label}</h3>
                    <p className="text-sm capitalize text-zinc-400">{selectedNode.type}</p>
                    {selectedNode.description && (
                      <p className="mt-1 text-xs text-zinc-500">{selectedNode.description}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Architecture
                </Button>
              </div>
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-medium text-zinc-400">Connected Nodes</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.connections.map((connId) => {
                    const conn = nodes.find((n) => n.id === connId);
                    return conn ? (
                      <Badge
                        key={conn.id}
                        variant="secondary"
                        className="cursor-pointer gap-1.5 px-3 py-1.5"
                        onClick={() => setSelectedNode(conn)}
                      >
                        <ArrowRight className="h-3 w-3" />
                        {conn.label}
                      </Badge>
                    ) : null;
                  })}
                  {selectedNode.connections.length === 0 && (
                    <p className="text-sm text-zinc-500">No direct connections</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
