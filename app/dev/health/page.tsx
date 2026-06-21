"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HealthCheck, HealthReport, HealthStatus } from "@/lib/health/diagnostics";

const statusStyles: Record<HealthStatus, string> = {
  connected: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {status === "connected" ? "Connected" : status === "warning" ? "Warning" : "Failed"}
    </Badge>
  );
}

function CheckCard({ check }: { check: HealthCheck }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{check.name}</CardTitle>
        <StatusBadge status={check.status} />
      </CardHeader>
      <CardContent className="space-y-2">
        {check.message && <p className="text-sm text-zinc-400">{check.message}</p>}
        {check.latencyMs !== undefined && (
          <p className="text-xs text-zinc-500">Latency: {check.latencyMs}ms</p>
        )}
        {check.details && (
          <dl className="grid gap-1 text-xs text-zinc-500">
            {Object.entries(check.details).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="capitalize">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="text-right text-zinc-300">{String(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

export default function DevHealthPage() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        if (!response.ok && !data.checks) {
          throw new Error(data.message ?? "Failed to load health report");
        }
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load health report");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-black p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">System Health</h1>
          <p className="text-sm text-zinc-400">
            Development diagnostics for Archon services. No secrets are displayed.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        )}

        {error && (
          <Card className="border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Health Check Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {report && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Overall Status</CardTitle>
                  <CardDescription>
                    {report.timestamp} · {report.environment}
                  </CardDescription>
                </div>
                <StatusBadge status={report.status} />
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {report.checks.map((check) => (
                <CheckCard key={check.name} check={check} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
