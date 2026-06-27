import { NextResponse } from "next/server";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docker = new DockerClient();
    const networks = docker.listNetworks();
    return NextResponse.json(networks);
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to list networks" }, { status: 500 });
  }
}
