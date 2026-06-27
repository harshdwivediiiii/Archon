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
    const info = docker.inspectContainer(id);
    return NextResponse.json(info);
  } catch (error) {
    if (error instanceof DockerError) {
      const status = error.stderr.includes("No such container") ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to inspect container" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const docker = new DockerClient();
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "start":
        docker.startContainer(id);
        return NextResponse.json({ message: `Container ${id} started` });
      case "stop":
        docker.stopContainer(id);
        return NextResponse.json({ message: `Container ${id} stopped` });
      case "restart":
        docker.restartContainer(id);
        return NextResponse.json({ message: `Container ${id} restarted` });
      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Use start, stop, or restart.` },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof DockerError) {
      const status = error.stderr.includes("No such container") ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to update container" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const docker = new DockerClient();
    const { id } = await params;
    docker.removeContainer(id, { force: true });
    return NextResponse.json({ message: `Container ${id} removed` });
  } catch (error) {
    if (error instanceof DockerError) {
      const status = error.stderr.includes("No such container") ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Failed to remove container" }, { status: 500 });
  }
}
