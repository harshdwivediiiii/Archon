import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient, KubectlError } from "@/lib/kubernetes/client";
import type { KubeDeployment } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface DeploymentSummary {
  name: string;
  namespace: string;
  replicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  strategy: string;
  age: string;
  conditions: { type: string; status: string; reason: string; message: string }[];
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

function toDeploymentSummary(dep: KubeDeployment): DeploymentSummary {
  return {
    name: dep.metadata.name,
    namespace: dep.metadata.namespace ?? "default",
    replicas: dep.status?.replicas ?? 0,
    readyReplicas: dep.status?.readyReplicas ?? 0,
    availableReplicas: dep.status?.availableReplicas ?? 0,
    updatedReplicas: dep.status?.updatedReplicas ?? 0,
    strategy: dep.spec.strategy?.type ?? "RollingUpdate",
    age: getAge(dep.metadata.creationTimestamp),
    conditions:
      dep.status?.conditions?.map((c) => ({
        type: c.type,
        status: c.status,
        reason: c.reason ?? "",
        message: c.message ?? "",
      })) ?? [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";

    const client = new KubernetesClient();
    const deployments = client.listDeployments(namespace);

    return NextResponse.json(deployments.map(toDeploymentSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list deployments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { namespace, name, replicas } = body;

    if (!name || replicas === undefined || replicas === null) {
      return NextResponse.json(
        { error: "Missing required fields: name, replicas" },
        { status: 400 },
      );
    }

    if (typeof replicas !== "number" || replicas < 0 || !Number.isInteger(replicas)) {
      return NextResponse.json(
        { error: "replicas must be a non-negative integer" },
        { status: 400 },
      );
    }

    const client = new KubernetesClient();
    client.scaleDeployment(name, replicas, namespace);

    return NextResponse.json({
      message: `Scaled deployment ${name} to ${replicas} replicas`,
      namespace: namespace ?? "default",
      name,
      replicas,
    });
  } catch (error) {
    if (error instanceof KubectlError && error.stderr.includes("not found")) {
      return NextResponse.json(
        { error: `Deployment not found` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scale deployment" },
      { status: 500 },
    );
  }
}
