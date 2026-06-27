import { NextRequest, NextResponse } from "next/server";
import { KubernetesClient } from "@/lib/kubernetes/client";
import type { KubeEvent } from "@/lib/kubernetes/client";

export const dynamic = "force-dynamic";

interface EventSummary {
  name: string;
  namespace: string;
  kind: string;
  involvedObject: string;
  type: string;
  reason: string;
  message: string;
  source: string;
  count: number;
  firstTimestamp: string;
  lastTimestamp: string;
  age: string;
}

function getAge(timestamp: string | undefined): string {
  if (!timestamp) return "unknown";
  const elapsed = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function toEventSummary(evt: KubeEvent): EventSummary {
  return {
    name: evt.metadata.name,
    namespace: evt.metadata.namespace ?? "default",
    kind: evt.involvedObject.kind,
    involvedObject: evt.involvedObject.name ?? "",
    type: evt.type,
    reason: evt.reason,
    message: evt.message,
    source: evt.source?.component ?? "",
    count: evt.count ?? 1,
    firstTimestamp: evt.firstTimestamp ?? "",
    lastTimestamp: evt.lastTimestamp ?? "",
    age: getAge(evt.lastTimestamp ?? evt.firstTimestamp),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const namespace = searchParams.get("namespace");

    const client = new KubernetesClient();
    const events = client.listEvents(namespace ?? undefined);

    return NextResponse.json(events.map(toEventSummary));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list events" },
      { status: 500 },
    );
  }
}
