"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Search,
  Server,
  Database,
  Globe,
  Dock,
  GitBranch,
  Network,
  Layers,
  Loader2,
} from "lucide-react";

interface Diagram {
  id: string;
  name: string;
  type: string;
  nodes: Array<{ id: string; label: string; type: string; x?: number; y?: number }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
}

const nodeTypes = [
  { type: "Service", icon: Server, color: "blue" },
  { type: "API", icon: Globe, color: "emerald" },
  { type: "Database", icon: Database, color: "purple" },
  { type: "Docker", icon: Dock, color: "blue" },
  { type: "GitHub", icon: GitBranch, color: "purple" },
  { type: "Kubernetes", icon: Network, color: "emerald" },
];

export default function ArchitecturePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadDiagram = useCallback((diagram: Diagram) => {
    const flowNodes: Node[] = diagram.nodes.map((n, i) => ({
      id: n.id,
      type: "default",
      position: {
        x: n.x ?? 100 + (i % 3) * 200,
        y: n.y ?? Math.floor(i / 3) * 150,
      },
      data: { label: n.label },
    }));

    const flowEdges: Edge[] = diagram.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const projRes = await fetch("/api/projects");
        if (cancelled || !projRes.ok) return;
        const projectList = await projRes.json();
        if (projectList.length === 0) return;

        const diagRes = await fetch(`/api/diagrams?projectId=${projectList[0].id}`);
        if (cancelled || !diagRes.ok) return;
        const data = await diagRes.json();
        if (cancelled) return;
        setDiagrams(data);
        if (data.length > 0) {
          setSelectedDiagram(data[0].id);
          loadDiagram(data[0]);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [loadDiagram]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setInspectorOpen(true);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Architecture Explorer</h1>
            <p className="text-zinc-400">Interactive architecture diagram</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedDiagram}
              onValueChange={(v) => {
                setSelectedDiagram(v);
                const d = diagrams.find((d) => d.id === v);
                if (d) loadDiagram(d);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a diagram" />
              </SelectTrigger>
              <SelectContent>
                {diagrams.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Search nodes..." className="w-64 pl-9" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {nodeTypes.map((nt) => (
            <Badge key={nt.type} variant="secondary" className="cursor-pointer gap-1.5 px-3 py-1.5">
              <nt.icon className="h-3.5 w-3.5" />
              {nt.type}
            </Badge>
          ))}
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="h-full p-0">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Network className="mx-auto h-12 w-12 text-zinc-600" />
                  <p className="mt-3 text-sm text-zinc-400">No architecture diagrams yet</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Import a repository to generate an architecture diagram
                  </p>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
                className="bg-zinc-900/30"
              >
                <Background color="#27272a" gap={20} />
                <Controls className="bg-zinc-900 border-zinc-800 [&>button]:border-zinc-800 [&>button]:text-zinc-400 [&>button]:hover:bg-zinc-800" />
                <MiniMap
                  className="border-zinc-800"
                  nodeColor="#3b82f6"
                  maskColor="rgba(0,0,0,0.8)"
                />
              </ReactFlow>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedNode?.data?.label as string || "Node Details"}</SheetTitle>
            <SheetDescription>Architecture component details and relationships</SheetDescription>
          </SheetHeader>
          {selectedNode && (
            <div className="mt-6 space-y-6">
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-2 text-sm font-medium text-zinc-400">Type</h4>
                <Badge>Service</Badge>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-2 text-sm font-medium text-zinc-400">Dependencies</h4>
                <div className="space-y-2">
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => {
                      const connected = nodes.find(
                        (n) => n.id === (edge.source === selectedNode.id ? edge.target : edge.source)
                      );
                      return (
                        <div key={edge.id} className="flex items-center gap-2 text-sm text-zinc-300">
                          <Layers className="h-3.5 w-3.5 text-zinc-500" />
                          {connected?.data?.label as string}
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h4 className="mb-2 text-sm font-medium text-zinc-400">Properties</h4>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">ID</span>
                    <span className="font-mono text-xs">{selectedNode.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Position</span>
                    <span className="font-mono text-xs">
                      ({selectedNode.position.x.toFixed(0)}, {selectedNode.position.y.toFixed(0)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
