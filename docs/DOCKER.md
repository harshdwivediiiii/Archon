# Docker Management Module

## Overview

Archon includes a full Docker dashboard that wraps the `docker` CLI through a typed `DockerClient` class. It provides a web-based interface for managing Docker images, containers, volumes, networks, and Compose projects.

**Source**: `lib/docker/client.ts` — 939 lines, fully typed TypeScript client.

## Features

| Feature | Description | Method |
|---------|-------------|--------|
| **Images** | List, inspect, remove, prune, history, build | `listImages`, `inspectImage`, `removeImage`, `pruneImages`, `getImageHistory`, `buildImage` |
| **Containers** | List, inspect, start, stop, restart, remove, logs, exec, stats | `listContainers`, `startContainer`, `stopContainer`, `restartContainer`, `removeContainer`, `getContainerLogs`, `followContainerLogs`, `getContainerStats`, `streamContainerStats`, `execInContainer` |
| **Volumes** | List, inspect, create, remove, prune | `listVolumes`, `inspectVolume`, `createVolume`, `removeVolume`, `pruneVolumes` |
| **Networks** | List, inspect, create, remove, prune | `listNetworks`, `inspectNetwork`, `createNetwork`, `removeNetwork`, `pruneNetworks` |
| **System** | Disk usage info | `systemDf` |
| **Compose** | Up, down, ps, logs, exec | `composeUp`, `composeDown`, `composePs`, `composeLogs`, `composeExec` |

## Architecture

```text
┌──────────────────────┐
│  Docker Dashboard    │  (Next.js UI)
├──────────────────────┤
│  DockerClient        │  (lib/docker/client.ts)
├──────────────────────┤
│  execSync / exec     │  (Node.js child_process)
├──────────────────────┤
│  docker CLI          │  (system binary, docker.sock)
├──────────────────────┤
│  Docker Daemon       │  (dockerd)
└──────────────────────┘
```

The `DockerClient` class:
1. Calls `docker` CLI commands via `execSync` and `exec`
2. Parses JSON output using Go template format `--format "{{json .}}"`
3. Returns fully typed TypeScript interfaces (see `DockerImageItem`, `DockerContainerItem`, etc.)
4. Supports streaming operations: container logs (`followContainerLogs`), stats (`streamContainerStats`)
5. Handles Docker Compose as a first-class feature

### Data Types

| Type | Description |
|------|-------------|
| `DockerImageItem` | Image metadata (id, repo, tag, size, created) |
| `DockerContainerItem` | Container state, ports, mounts, networks |
| `DockerVolumeItem` | Volume name, driver, mountpoint, scope |
| `DockerNetworkItem` | Network config, attached containers, subnet |
| `ContainerStats` | Real-time CPU, memory, network, block I/O |
| `DockerComposeProject` | Compose project name and status |
| `SystemDFInfo` | Aggregate disk usage for images, containers, volumes, build cache |

## Usage Guide

```typescript
import { DockerClient } from "@/lib/docker/client";

const docker = new DockerClient();

// List all running containers
const containers = docker.listContainers({ all: false });

// View container stats
const stats = docker.getContainerStats("container-id");
console.log(`CPU: ${stats.cpuPercent}%, Memory: ${stats.memoryUsage} bytes`);

// Stream container logs
const { stdout, stderr } = docker.followContainerLogs("container-id", { tail: 50 });

// Build an image
docker.buildImage({
  context: "/path/to/project",
  dockerfile: "./Dockerfile",
  tag: "my-app:latest",
  noCache: true,
});

// Manage Compose
docker.composeUp({
  configFile: "./docker-compose.yml",
  detach: true,
  build: true,
});

// Inspect system disk usage
const df = docker.systemDf();
console.log(`Total images: ${df.imagesCount}, Size: ${df.imagesSize} bytes`);

// Prune unused resources
docker.pruneImages({ all: true });
docker.pruneVolumes();
```

## Dashboard Pages

UI routes under `app/dashboard/docker/` provide:

- **Images**: List with sort/filter, image history, build dialog
- **Containers**: Live status, start/stop/restart actions, log viewer, stats charts
- **Volumes**: Create/remove, disk usage
- **Networks**: Create/remove, attached container view
- **Compose**: Project up/down, service logs, multi-service management
- **System**: Disk usage dashboard with cleanup actions
