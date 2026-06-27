import { NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = new KubernetesClient();
    const namespaces = client.listNamespaces();
    const namespaceNames = namespaces.map((ns) => ns.metadata.name);

    return NextResponse.json(namespaceNames);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list namespaces" },
      { status: 500 },
    );
  }
}
