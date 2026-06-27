import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { KubeService } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface ServiceSummary {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: { name: string; protocol: string; port: number; targetPort: string; nodePort: string }[];
  selector: Record<string, string>;
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

function toServiceSummary(svc: KubeService): ServiceSummary {
  return {
    name: svc.metadata.name,
    namespace: svc.metadata.namespace ?? "default",
    type: svc.spec.type ?? "ClusterIP",
    clusterIP: svc.spec.clusterIP ?? "",
    externalIP: svc.spec.externalIPs?.[0] ?? "",
    ports:
      svc.spec.ports?.map((p) => ({
        name: p.name ?? "",
        protocol: p.protocol,
        port: p.port,
        targetPort: p.targetPort?.toString() ?? "",
        nodePort: p.nodePort?.toString() ?? "",
      })) ?? [],
    selector: svc.spec.selector ?? {},
    age: getAge(svc.metadata.creationTimestamp),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";

    const client = new KubernetesClient();
    const services = client.listServices(namespace);

    return NextResponse.json(services.map(toServiceSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list services" },
      { status: 500 },
    );
  }
}
