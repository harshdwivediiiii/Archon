import { NextRequest, NextResponse } from "next/server";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const docker = new DockerClient();
    const { id } = await params;
    const stats = docker.getContainerStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof DockerError) {
      const status = error.stderr.includes("No such container") ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to get container stats" }, { status: 500 });
  }
}
