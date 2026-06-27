import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { KubeSecret } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface SecretSummary {
  name: string;
  namespace: string;
  type: string;
  dataCount: number;
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

function toSecretSummary(secret: KubeSecret): SecretSummary {
  return {
    name: secret.metadata.name,
    namespace: secret.metadata.namespace ?? "default",
    type: secret.type,
    dataCount: secret.data ? Object.keys(secret.data).length : 0,
    age: getAge(secret.metadata.creationTimestamp),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";

    const client = new KubernetesClient();
    const items = client.listSecrets(namespace);

    return NextResponse.json(items.map(toSecretSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list secrets" },
      { status: 500 },
    );
  }
}
