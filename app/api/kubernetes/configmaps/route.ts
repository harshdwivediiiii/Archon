import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { KubeConfigMap } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface ConfigMapSummary {
  name: string;
  namespace: string;
  data: number;
  binaryData: number;
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

function toConfigMapSummary(cm: KubeConfigMap): ConfigMapSummary {
  return {
    name: cm.metadata.name,
    namespace: cm.metadata.namespace ?? "default",
    data: cm.data ? Object.keys(cm.data).length : 0,
    binaryData: cm.binaryData ? Object.keys(cm.binaryData).length : 0,
    age: getAge(cm.metadata.creationTimestamp),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";

    const client = new KubernetesClient();
    const items = client.listConfigMaps(namespace);

    return NextResponse.json(items.map(toConfigMapSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list configmaps" },
      { status: 500 },
    );
  }
}
