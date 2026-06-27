import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { KubeIngress } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface IngressSummary {
  name: string;
  namespace: string;
  className: string;
  hosts: string[];
  tls: boolean;
  age: string;
}

function getAge(creationTimestamp: string | undefined): string {
  if (!creationTimestamp) return "unknown";
  const elapsed = Date.now() - new Date(creationTimestamp).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function toIngressSummary(ingress: KubeIngress): IngressSummary {
  const hosts = ingress.spec.rules?.map((r) => r.host ?? "*").filter(Boolean) ?? [];
  return {
    name: ingress.metadata.name,
    namespace: ingress.metadata.namespace ?? "default",
    className: ingress.spec.ingressClassName ?? "",
    hosts,
    tls: (ingress.spec.tls?.length ?? 0) > 0,
    age: getAge(ingress.metadata.creationTimestamp),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";

    const client = new KubernetesClient();
    const items = client.listIngresses(namespace);

    return NextResponse.json(items.map(toIngressSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list ingresses" },
      { status: 500 },
    );
  }
}
