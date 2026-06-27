import { NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { ResourceMetrics } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface MetricsResponse {
  pods: ResourceMetrics[];
  totalCpu: string;
  totalMemory: string;
  podCount: number;
}

export async function GET() {
  try {
    const client = new KubernetesClient();
    const namespaces = client.listNamespaces();

    const allMetrics: ResourceMetrics[] = [];

    for (const ns of namespaces) {
      try {
        const metrics = client.topPods(ns.metadata.name);
        allMetrics.push(...metrics);
      } catch {
        // skip namespaces where metrics are unavailable
      }
    }

    const totalCpuValue = allMetrics.reduce((sum, m) => sum + m.cpuValue, 0);
    const totalMemoryValue = allMetrics.reduce((sum, m) => sum + m.memoryValue, 0);

    function formatCpu(value: number): string {
      if (value >= 1000) return `${(value / 1000).toFixed(2)} CPU`;
      return `${Math.round(value)}m`;
    }

    function formatMemory(value: number): string {
      if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} Gi`;
      if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} Mi`;
      if (value >= 1024) return `${(value / 1024).toFixed(2)} Ki`;
      return `${value} bytes`;
    }

    const response: MetricsResponse = {
      pods: allMetrics,
      totalCpu: formatCpu(totalCpuValue),
      totalMemory: formatMemory(totalMemoryValue),
      podCount: allMetrics.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
