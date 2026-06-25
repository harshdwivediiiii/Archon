"use client";

import { useEffect, useState, use } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUp, ArrowDown, AlertTriangle, TrendingUp } from "lucide-react";

interface ImpactNode {
  id: string;
  label: string;
  depth: number;
}

interface ImpactData {
  nodeId: string;
  nodeLabel: string;
  riskScore: "low" | "medium" | "high" | "critical";
  blastRadius: number;
  blastPercentage: number;
  totalNodes: number;
  maxDepth: number;
  avgDepth: number;
  upstreamCount: number;
  downstreamCount: number;
  upstream: ImpactNode[];
  downstream: ImpactNode[];
}

const riskColors = {
  low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  high: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
};

export default function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ repositoryId?: string; nodeId?: string }>;
}) {
  const params = use(searchParams);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.repositoryId || !params.nodeId) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/impact?repositoryId=${params.repositoryId}&nodeId=${params.nodeId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setImpact(data);
        } else {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) setError(body.error || "Failed to load impact analysis");
        }
      } catch {
        if (!cancelled) setError("Failed to load impact analysis");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [params.repositoryId, params.nodeId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-red-400">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!impact) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Impact Analysis</h1>
          <p className="text-zinc-400">
            Blast radius analysis for <span className="font-semibold text-white">{impact.nodeLabel}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className={riskColors[impact.riskScore]}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{impact.riskScore}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Blast Radius</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{impact.blastRadius}</p>
              <p className="text-xs text-zinc-500">of {impact.totalNodes} nodes ({impact.blastPercentage}%)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Upstream Dependents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-400">{impact.upstreamCount}</p>
              <p className="text-xs text-zinc-500">services that depend on this</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Downstream Deps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#0070f3]">{impact.downstreamCount}</p>
              <p className="text-xs text-zinc-500">services this depends on</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-amber-400" />
                Upstream Dependencies
              </CardTitle>
              <CardDescription>Services that depend on {impact.nodeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {impact.upstream.length === 0 ? (
                <p className="text-sm text-zinc-500">No upstream dependencies</p>
              ) : (
                <div className="space-y-2">
                  {impact.upstream.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                    >
                      <span className="text-sm text-white">{node.label}</span>
                      <Badge variant="outline" className="text-xs">
                        depth {node.depth}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-[#0070f3]" />
                Downstream Dependencies
              </CardTitle>
              <CardDescription>Services that {impact.nodeLabel} depends on</CardDescription>
            </CardHeader>
            <CardContent>
              {impact.downstream.length === 0 ? (
                <p className="text-sm text-zinc-500">No downstream dependencies</p>
              ) : (
                <div className="space-y-2">
                  {impact.downstream.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 p-3"
                    >
                      <span className="text-sm text-white">{node.label}</span>
                      <Badge variant="outline" className="text-xs">
                        depth {node.depth}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Failure Scenario: <span className="text-white">{impact.nodeLabel}</span>
            </CardTitle>
            <CardDescription>What happens when this service goes down</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm text-zinc-300">
                If <strong className="text-white">{impact.nodeLabel}</strong> fails,{" "}
                <strong className="text-amber-400">{impact.upstreamCount} services</strong> that depend on it
                will be affected. The blast radius spans{" "}
                <strong className="text-red-400">{impact.blastRadius} nodes</strong> (
                {impact.blastPercentage}% of the system).
              </p>
            </div>

            {impact.upstream.length > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Directly Impacted Services
                </h4>
                <div className="flex flex-wrap gap-2">
                  {impact.upstream.slice(0, 10).map((node) => (
                    <Badge key={node.id} variant="outline" className="border-red-500/30 text-red-300">
                      {node.label}
                    </Badge>
                  ))}
                  {impact.upstream.length > 10 && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      +{impact.upstream.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <TrendingUp className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-400">
                  Average dependency depth: <span className="text-white">{impact.avgDepth}</span> | 
                  Maximum chain depth: <span className="text-white">{impact.maxDepth}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
