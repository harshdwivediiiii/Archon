"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, GitBranch, Network, Sparkles, ExternalLink, ArrowRight, Cpu } from "lucide-react";

const initialNodes = [
  { id: "1", label: "API Gateway", type: "service", connections: ["2", "3"] },
  { id: "2", label: "Auth Service", type: "service", connections: ["1", "4"] },
  { id: "3", label: "User Service", type: "service", connections: ["1", "5"] },
  { id: "4", label: "PostgreSQL", type: "database", connections: ["2"] },
  { id: "5", label: "Redis Cache", type: "database", connections: ["3"] },
  { id: "6", label: "Docker", type: "infra", connections: ["2", "3"] },
];

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<typeof initialNodes[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = initialNodes.filter((n) =>
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
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
                    <GitBranch className="h-8 w-8 text-blue-400" />
                  </div>
                  <p className="text-sm text-zinc-400">Interactive graph visualization</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Click a node to inspect details
                  </p>
                </div>
              </div>
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
                    const conn = initialNodes.find((n) => n.id === connId);
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
