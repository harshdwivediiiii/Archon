import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient, KubectlError } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params;
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace") ?? "default";
    const tailLines = searchParams.get("tailLines");
    const container = searchParams.get("container") ?? undefined;

    const client = new KubernetesClient();
    const logs = client.getPodLogs(name, namespace, {
      container,
      tail: tailLines ? parseInt(tailLines, 10) : undefined,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    if (error instanceof KubectlError && error.stderr.includes("not found")) {
      return NextResponse.json(
        { error: "Pod not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get pod logs" },
      { status: 500 },
    );
  }
}
