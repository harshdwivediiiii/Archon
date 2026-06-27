import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { KubePod } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

export interface PodSummary {
  name: string;
  namespace: string;
  status: string;
  node: string;
  ip: string;
  restarts: number;
  age: string;
  containers: { name: string; image: string; ready: boolean }[];
}

function getAge(startTime: string | undefined): string {
  if (!startTime) return "unknown";
  const elapsed = Date.now() - new Date(startTime).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function toPodSummary(pod: KubePod): PodSummary {
  const containerStatuses = pod.status?.containerStatuses ?? [];
  const restarts = containerStatuses.reduce((sum, cs) => sum + cs.restartCount, 0);

  return {
    name: pod.metadata.name,
    namespace: pod.metadata.namespace ?? "default",
    status: pod.status?.phase ?? "Unknown",
    node: pod.spec.nodeName ?? "",
    ip: pod.status?.podIP ?? "",
    restarts,
    age: getAge(pod.status?.startTime),
    containers: pod.spec.containers.map((c) => {
      const cs = containerStatuses.find((s) => s.name === c.name);
      return {
        name: c.name,
        image: c.image,
        ready: cs?.ready ?? false,
      };
    }),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";
    const labelSelector = searchParams.get("labelSelector");

    const client = new KubernetesClient();
    const pods = client.listPods(namespace);

    const filtered = labelSelector
      ? pods.filter((pod) => {
          const labels = pod.metadata.labels ?? {};
          return labelSelector.split(",").every((selector) => {
            const [key, value] = selector.split("=");
            return value ? labels[key] === value : key in labels;
          });
        })
      : pods;

    return NextResponse.json(filtered.map(toPodSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list pods" },
      { status: 500 },
    );
  }
}
