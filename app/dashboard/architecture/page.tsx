"use client";

import { useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Server,
  Database,
  Globe,
  Dock,
  GitBranch,
  Network,
  Cpu,
  Layers,
} from "lucide-react";

const initialNodes: Node[] = [
  { id: "1", type: "default", position: { x: 250, y: 0 }, data: { label: "API Gateway" } },
  { id: "2", type: "default", position: { x: 100, y: 150 }, data: { label: "Auth Service" } },
  { id: "3", type: "default", position: { x: 400, y: 150 }, data: { label: "User Service" } },
  { id: "4", type: "default", position: { x: 100, y: 300 }, data: { label: "PostgreSQL" } },
  { id: "5", type: "default", position: { x: 400, y: 300 }, data: { label: "Redis" } },
  { id: "6", type: "default", position: { x: 250, y: 450 }, data: { label: "Docker" } },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4" },
  { id: "e3-5", source: "3", target: "5" },
  { id: "e2-6", source: "2", target: "6" },
  { id: "e3-6", source: "3", target: "6" },
];

const nodeTypes = [
  { type: "Service", icon: Server, color: "blue" },
  { type: "API", icon: Globe, color: "emerald" },
  { type: "Database", icon: Database, color: "purple" },
  { type: "Docker", icon: Dock, color: "blue" },
  { type: "GitHub", icon: GitBranch, color: "purple" },
  { type: "Kubernetes", icon: Network, color: "emerald" },
];

export default function ArchitecturePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

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
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input placeholder="Search nodes..." className="w-64 pl-9" />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-wrap gap-2">
            {nodeTypes.map((nt) => (
              <Badge key={nt.type} variant="secondary" className="cursor-pointer gap-1.5 px-3 py-1.5">
                <nt.icon className="h-3.5 w-3.5" />
                {nt.type}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="h-full p-0">
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
