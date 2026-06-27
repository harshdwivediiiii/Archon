import { NextRequest, NextResponse } from "next/server";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const docker = new DockerClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const tail = searchParams.get("tail")
      ? parseInt(searchParams.get("tail")!, 10)
      : undefined;
    const since = searchParams.get("since") ?? undefined;
    const until = searchParams.get("until") ?? undefined;
    const timestamps = searchParams.get("timestamps") === "true";

    const logs = docker.getContainerLogs(id, { tail, since, until, timestamps });
    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof DockerError) {
      const status = error.stderr.includes("No such container") ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to get container logs" }, { status: 500 });
  }
}
