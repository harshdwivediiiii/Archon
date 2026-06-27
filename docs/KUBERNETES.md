# Kubernetes Dashboard Module

## Overview

Archon includes a Lens-inspired Kubernetes dashboard that provides a web-based interface for managing Kubernetes clusters. It wraps the `kubectl` CLI under the hood, exposed through a typed `KubernetesClient` class.

**Source**: `lib/kubernetes/client.ts` — 1,548 lines, fully typed TypeScript client.

## Features

| Feature | Description | Method |
|---------|-------------|--------|
| **Pods** | List, describe, get logs, exec commands, terminal access | `listPods`, `getPod`, `getPodLogs`, `execInPod`, `getPodTerminal` |
| **Deployments** | List, describe, scale, restart, rollout undo/history/status | `listDeployments`, `scaleDeployment`, `restartDeployment`, `rollout*` |
| **Services** | List, describe, inspect | `listServices`, `getService`, `describeService` |
| **Ingress** | List, describe, inspect TLS/rules | `listIngresses`, `getIngress`, `describeIngress` |
| **ConfigMaps** | List, describe, get YAML | `listConfigMaps`, `getConfigMap`, `describeConfigMap` |
| **Secrets** | List, describe (redacted) | `listSecrets`, `getSecret`, `describeSecret` |
| **Events** | List with filtering by namespace | `listEvents`, `getEvent`, `describeEvent` |
| **Metrics** | Pod and node resource usage (`kubectl top`) | `topPods`, `topNodes` |
| **Nodes** | List, describe, node conditions | `listNodes`, `getNode`, `describeNode` |
| **StatefulSets** | List, describe, scale, restart, rollout | `listStatefulSets`, `scaleStatefulSet`, `restartStatefulSet` |
| **DaemonSets** | List, describe, restart | `listDaemonSets`, `restartDaemonSet` |
| **PVC / PV** | Persistent volumes and claims | `listPersistentVolumes`, `listPersistentVolumeClaims` |
| **Namespaces** | List, describe | `listNamespaces`, `getNamespace` |
| **Apply & Delete** | Apply YAML, delete resources, dry-run validation | `apply`, `deleteResource`, `validate`, `dryRun` |
| **Port Forward** | Forward local ports to pod/service | `portForward` |
| **Copy** | Copy files to/from containers | `cp` |
| **Terminal** | Interactive pod shell via websocket-like stream | `PodTerminal` class |

## Architecture

```text
┌──────────────────────┐
│  Kubernetes Dashboard │  (Next.js UI)
├──────────────────────┤
│  KubernetesClient     │  (lib/kubernetes/client.ts)
├──────────────────────┤
│  execSync / spawn    │  (Node.js child_process)
├──────────────────────┤
│  kubectl CLI         │  (system binary)
├──────────────────────┤
│  Kubernetes API      │  (cluster API server)
└──────────────────────┘
```

The `KubernetesClient` class:
1. Detects `kubectl` in PATH (checks common locations)
2. Wraps each command as typed methods with full TypeScript interfaces
3. Supports custom kubeconfig, context, and default namespace
4. Returns structured JSON (parsed from `kubectl -o json`) or raw strings
5. Provides interactive pod terminal via `spawn` with event callbacks

### Error Handling

- `KubectlError` — generic kubectl command failure
- `KubectlNotFoundError` — kubectl not in PATH
- `ResourceNotFoundError` — specific resource not found (extends KubectlError)

## Usage Guide

```typescript
import { KubernetesClient } from "@/lib/kubernetes/client";

const k8s = new KubernetesClient({
  kubeconfig: "/path/to/kubeconfig", // optional
  context: "my-cluster",             // optional
  namespace: "default",              // optional, defaults to "default"
});

// List pods
const pods = await k8s.listPods("my-namespace");

// Stream pod logs
k8s.logsFollow("my-pod", "default", "container-name");

// Scale a deployment
k8s.scaleDeployment("my-app", 5, "production");

// Apply YAML
k8s.apply(`
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:latest
`);

// Get resource metrics
const metrics = k8s.topPods("default");

// Open interactive terminal
const term = k8s.getPodTerminal("my-pod", "default", { shell: "/bin/bash" });
term.onData((data) => console.log(data));
term.writeLine("ls -la");
```

## AI Integration

Archon's AI features enhance Kubernetes management via `lib/ai/chat.ts`:

- **YAML Explanation**: Send a pod/deployment YAML and get a plain-English explanation
- **Configuration Optimization**: Ask AI to optimize resource requests/limits based on patterns
- **Troubleshooting**: Describe pod crash-loop or pending state and get diagnostic suggestions
- **Rollout Analysis**: Get natural-language summaries of deployment rollout status

## Dashboard Pages

UI routes under `app/dashboard/kubernetes/` mirror the kubectl resource types. The dashboard displays:

- Resource lists with status indicators (color-coded by phase)
- YAML/JSON viewers with syntax highlighting
- Live log streaming
- Resource editor with apply/dry-run validation
- Cluster overview with node health and resource utilization charts
