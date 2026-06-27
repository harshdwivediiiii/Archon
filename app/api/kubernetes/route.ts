import { NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = new KubernetesClient();
    const version = client.getVersion();

    return NextResponse.json({
      version,
      operations: {
        namespaces: {
          list: "GET /api/kubernetes/namespaces",
        },
        pods: {
          list: "GET /api/kubernetes/pods?namespace=&labelSelector=",
          logs: "GET /api/kubernetes/pods/:name/logs?namespace=&tailLines=&container=",
        },
        deployments: {
          list: "GET /api/kubernetes/deployments?namespace=",
          scale: "POST /api/kubernetes/deployments { namespace, name, replicas }",
        },
        services: {
          list: "GET /api/kubernetes/services?namespace=",
        },
        events: {
          list: "GET /api/kubernetes/events?namespace=",
        },
        metrics: {
          pods: "GET /api/kubernetes/metrics?namespace=",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get API info" },
      { status: 500 },
    );
  }
}
