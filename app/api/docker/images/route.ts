import { NextRequest, NextResponse } from "next/server";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const docker = new DockerClient();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const images = docker.listImages({ all });
    return NextResponse.json(images);
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const docker = new DockerClient();
    const result = docker.pruneImages({ all: true });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to prune images" }, { status: 500 });
  }
}
