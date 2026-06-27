import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { DockerClient, DockerError } from "@/lib/docker/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const docker = new DockerClient();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") !== "false";

    const containers = docker.listContainers({ all });
    return NextResponse.json(containers);
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Failed to list containers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, image, name, ...rest } = body;

    switch (action) {
      case "create": {
        if (!image) {
          return NextResponse.json({ error: "image is required" }, { status: 400 });
        }
        const args = ["container", "create"];
        if (name) args.push("--name", name);
        for (const [key, value] of Object.entries(rest)) {
          if (typeof value === "string") args.push(`--${key}`, value);
        }
        args.push(image);
        const cmd = `docker ${args.join(" ")}`;
        const stdout = execSync(cmd, { encoding: "utf-8" });
        return NextResponse.json({ id: stdout.trim() }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof DockerError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    if (error instanceof Error && "stderr" in error) {
      return NextResponse.json(
        { error: (error as { stderr: string }).stderr },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "Failed to manage container" }, { status: 500 });
  }
}
