import { NextRequest, NextResponse } from "next/server";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docker = new DockerClient();
    const volumes = docker.listVolumes();
    return NextResponse.json(volumes);
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to list volumes" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const docker = new DockerClient();
    const result = docker.pruneVolumes();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to prune volumes" }, { status: 500 });
  }
}
