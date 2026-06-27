import { NextResponse } from "next/server";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const docker = new DockerClient();
    const [df, images, containers, volumes] = await Promise.all([
      Promise.resolve(docker.systemDf()),
      Promise.resolve(docker.listImages()),
      Promise.resolve(docker.listContainers({ all: true })),
      Promise.resolve(docker.listVolumes()),
    ]);

    return NextResponse.json({
      server: {
        available: true,
        version: null,
        apiVersion: null,
        os: null,
        kernel: null,
      },
      summary: {
        images: { total: df.imagesCount, size: df.imagesSize },
        containers: { total: df.containersCount, running: containers.filter((c) => c.state === "running").length, size: df.containersSize },
        volumes: { total: df.volumesCount, size: df.volumesSize },
        buildCache: { count: df.buildCacheCount, size: df.buildCacheSize },
        totalSize: df.totalSize,
        reclaimableSize: df.reclaimableSize,
      },
    });
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json(
        { error: error.message, server: { available: false } },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to get Docker status" },
      { status: 500 }
    );
  }
}
