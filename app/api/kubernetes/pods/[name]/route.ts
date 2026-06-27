import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient, KubectlError } from "@/lib/kubernetes/client";
import type { KubePod } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface PodDetailResponse {
  name: string;
  namespace: string;
  status: string;
  node: string;
  ip: string;
  hostIP: string;
  restarts: number;
  age: string;
  qosClass: string;
  serviceAccount: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  containers: {
    name: string;
    image: string;
    ready: boolean;
    started: boolean;
    state: string;
    stateReason: string;
    restartCount: number;
  }[];
  conditions: { type: string; status: string; reason: string; message: string }[];
  yaml: string;
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

function getContainerState(cs: { state?: { running?: unknown; waiting?: { reason?: string }; terminated?: { reason?: string } } }): { state: string; reason: string } {
  if (cs.state?.running) return { state: "Running", reason: "" };
  if (cs.state?.waiting) return { state: "Waiting", reason: cs.state.waiting.reason ?? "" };
  if (cs.state?.terminated) return { state: "Terminated", reason: cs.state.terminated.reason ?? "" };
  return { state: "Unknown", reason: "" };
}

function toPodDetail(pod: KubePod, yaml: string): PodDetailResponse {
  const containerStatuses = pod.status?.containerStatuses ?? [];
  const restarts = containerStatuses.reduce((sum, cs) => sum + cs.restartCount, 0);

  return {
    name: pod.metadata.name,
    namespace: pod.metadata.namespace ?? "default",
    status: pod.status?.phase ?? "Unknown",
    node: pod.spec.nodeName ?? "",
    ip: pod.status?.podIP ?? "",
    hostIP: pod.status?.hostIP ?? "",
    restarts,
    age: getAge(pod.status?.startTime),
    qosClass: pod.status?.qosClass ?? "",
    serviceAccount: pod.spec.serviceAccountName ?? "",
    labels: pod.metadata.labels ?? {},
    annotations: pod.metadata.annotations ?? {},
    containers: pod.spec.containers.map((c) => {
      const cs = containerStatuses.find((s) => s.name === c.name);
      const { state, reason } = cs ? getContainerState(cs) : { state: "Unknown", reason: "" };
      return {
        name: c.name,
        image: c.image,
        ready: cs?.ready ?? false,
        started: cs?.started ?? false,
        state,
        stateReason: reason,
        restartCount: cs?.restartCount ?? 0,
      };
    }),
    conditions:
      pod.status?.conditions?.map((cond) => ({
        type: cond.type,
        status: cond.status,
        reason: cond.reason ?? "",
        message: cond.message ?? "",
      })) ?? [],
    yaml,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";

    const client = new KubernetesClient();
    const pod = client.getPod(name, namespace);
    const yaml = client.getYaml("pod", name, namespace);

    return NextResponse.json(toPodDetail(pod, yaml));
  } catch (error) {
    if (error instanceof KubectlError && error.stderr.includes("not found")) {
      return NextResponse.json(
        { error: "Pod not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get pod" },
      { status: 500 },
    );
  }
}
