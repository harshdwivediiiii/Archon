import type { Node, Edge } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type {
  DetectedService,
  DetectedApi,
  DetectedDatabase,
  DetectedInfrastructure,
  DetectedModule,
  DetectedEvent,
} from "@/components/architecture/types";

export const DIAGRAM_MODES = [
  { id: "system", label: "System Architecture", icon: "Network" },
  { id: "uml", label: "UML Diagram", icon: "Code2" },
  { id: "infrastructure", label: "Infrastructure", icon: "Box" },
  { id: "dataflow", label: "Data Flow", icon: "GitFork" },
  { id: "dependencies", label: "Dependency Graph", icon: "Package" },
  { id: "security", label: "Security View", icon: "Shield" },
  { id: "timeline", label: "Timeline View", icon: "History" },
] as const;

export type DiagramMode = (typeof DIAGRAM_MODES)[number]["id"];

export const NODE_COLORS: Record<string, string> = {
  frontend: "#3b82f6",
  backend: "#10b981",
  database: "#f59e0b",
  infrastructure: "#8b5cf6",
  service: "#06b6d4",
  library: "#6b7280",
  queue: "#ef4444",
  api: "#ec4899",
  uml_class: "#a855f7",
  uml_interface: "#06b6d4",
  security: "#ef4444",
  env_var: "#f59e0b",
  cloud: "#3b82f6",
  event: "#8b5cf6",
  external: "#6b7280",
  gateway: "#06b6d4",
  cdn: "#ec4899",
  container: "#06b6d4",
  certificate: "#10b981",
  secret: "#ef4444",
  config: "#f59e0b",
  health: "#22c55e",
  timeline_node: "#06b6d4",
};

export const LAYER_ORDER = [
  { key: "user", label: "Users", y: 0 },
  { key: "cdn", label: "CDN", y: 0.5 },
  { key: "frontend", label: "Frontend", y: 1 },
  { key: "gateway", label: "API Gateway", y: 1.5 },
  { key: "backend", label: "Backend / API Layer", y: 2 },
  { key: "service", label: "Services", y: 3 },
  { key: "queue", label: "Message Queues / Events", y: 4 },
  { key: "database", label: "Databases", y: 5 },
  { key: "infrastructure", label: "Infrastructure", y: 6 },
  { key: "cloud", label: "Cloud", y: 6.5 },
  { key: "external", label: "External Services", y: 7 },
  { key: "library", label: "Libraries", y: 8 },
];

const PROTOCOL_COLORS: Record<string, string> = {
  REST: "#10b981",
  HTTP: "#10b981",
  HTTPS: "#10b981",
  GRAPHQL: "#ec4899",
  GRPC: "#3b82f6",
  WEBSOCKET: "#f59e0b",
  SQL: "#f59e0b",
  REDIS: "#ef4444",
  KAFKA: "#8b5cf6",
  RABBITMQ: "#f97316",
  IMPORT: "#6366f1",
  DEPLOY: "#8b5cf6",
  EVENT: "#06b6d4",
  READ: "#3b82f6",
  WRITE: "#ef4444",
  REQUEST: "#10b981",
  RESPONSE: "#f59e0b",
  CONNECT: "#06b6d4",
  PROXY: "#8b5cf6",
};

function getEdgeColor(type: string, protocol: string): string {
  const p = (protocol || type).toUpperCase();
  return PROTOCOL_COLORS[p] || "#6366f1";
}

export interface ModeNode extends Node {
  data: {
    label: string;
    description: string;
    technology: string;
    dependencyCount: number;
    nodeType: string;
    layer?: string;
    filePath?: string;
    functions?: string[];
    classes?: string[];
    interfaces?: string[];
    dependencies?: string[];
    dependents?: string[];
    sourceFile?: string;
    port?: number;
    envVars?: string[];
    technologyIcon?: string;
    endpoints?: string[];
    databases?: string[];
    methods?: { name: string; params: string; returnType: string; visibility: string }[];
    properties?: { name: string; type: string; visibility: string }[];
    extends?: string;
    implements?: string[];
    protocol?: string;
    metrics?: { label: string; value: string; color: string }[];
    health?: { score: number; issues: string[] };
    group?: string;
    version?: string;
    environment?: string;
    region?: string;
    confidence?: number;
    risk?: string;
    severity?: string;
    category?: string;
    recommendation?: string;
    eventType?: string;
    direction?: string;
    timestamp?: string;
    changeType?: string;
    source?: string;
    target?: string;
    deploymentConfig?: string;
  };
}

export interface ModeEdge extends Edge {
  data?: { label: string; protocol: string };
}

function buildNode(
  id: string,
  label: string,
  description: string,
  technology: string,
  nodeType: string,
  layer: string,
  dependencyCount = 0,
  extra: Partial<ModeNode["data"]> = {}
): ModeNode {
  return {
    id,
    type: "default",
    position: { x: 0, y: 0 },
    data: {
      label,
      description,
      technology,
      dependencyCount,
      nodeType,
      layer,
      ...extra,
    },
  };
}

function buildEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  protocol: string
): ModeEdge {
  const color = getEdgeColor("", protocol);
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: true,
    label,
    style: { stroke: color, strokeWidth: 2 },
    labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color },
    data: { label, protocol },
  };
}

export function transformSystemView(
  services: DetectedService[],
  apis: DetectedApi[],
  databases: DetectedDatabase[],
  modules: DetectedModule[],
  events: DetectedEvent[]
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();
  const envVarRegistry = new Set<string>();

  // CDN / Gateway node if APIs exist
  if (apis.length > 0) {
    nodes.push(buildNode("cdn", "CDN", "Content Delivery Network", "CloudFront", "cdn", "cdn", 0, { technologyIcon: "AWS" }));
    nodes.push(buildNode("gateway", "API Gateway", "API Gateway / Load Balancer", "ALB", "gateway", "gateway", 0, { technologyIcon: "NGINX", port: 443 }));
    edgeKeys.add("e-cdn-gateway");
    edges.push(buildEdge("e-cdn-gateway", "cdn", "gateway", "HTTPS", "HTTPS"));
    nodeIds.add("cdn");
    nodeIds.add("gateway");
  }

  for (const svc of services) {
    const nid = `service-${svc.name}`;
    nodeIds.add(nid);
    const layer = svc.type === "frontend" ? "frontend" : svc.type === "queue" ? "queue" : "service";
    const endpoints = apis.filter((a) => a.serviceName === svc.name).map((a) => `${a.method} ${a.path}`);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, svc.type === "frontend" ? "frontend" : "backend", layer, svc.dependencies.length, {
        filePath: svc.sourcePath,
        port: svc.port,
        envVars: svc.envVars,
        dependencies: svc.dependencies,
        databases: svc.databases,
        technologyIcon: svc.technology,
        endpoints: endpoints.length > 0 ? endpoints : undefined,
      })
    );

    for (const ev of svc.envVars || []) envVarRegistry.add(ev);

    // Connect gateway to backend services
    if (nodeIds.has("gateway")) {
      const gatewayKey = `e-gateway-${nid}`;
      if (!edgeKeys.has(gatewayKey)) {
        edgeKeys.add(gatewayKey);
        edges.push(buildEdge(gatewayKey, "gateway", nid, svc.port ? `:${svc.port}` : "PROXY", "PROXY"));
      }
    }
  }

  for (const db of databases) {
    const nid = `db-${db.type}${db.name ? `-${db.name}` : ""}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(
        buildNode(nid, db.name || db.type.charAt(0).toUpperCase() + db.type.slice(1), `${db.type} Database`, db.type, "database", "database", 0, {
          technologyIcon: db.type,
        })
      );
    }
  }

  for (const mod of modules) {
    const srcService = services.find((s) => mod.sourceFile.startsWith(s.sourcePath.split("/").slice(0, -1).join("/")));
    if (!srcService) continue;
    for (const imp of mod.imports) {
      const tgtService = services.find(
        (s) => imp === s.name || imp.startsWith(s.name + "/") || imp.includes(s.name)
      );
      if (tgtService && tgtService.name !== srcService.name) {
        const key = `e-service-${srcService.name}-service-${tgtService.name}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, `service-${srcService.name}`, `service-${tgtService.name}`, imp.includes("grpc") ? "gRPC" : imp.includes("graphql") ? "GraphQL" : "REST", imp.includes("grpc") ? "GRPC" : imp.includes("graphql") ? "GRAPHQL" : "REST"));
        }
      }
    }
  }

  for (const svc of services) {
    for (const db of databases) {
      if (svc.databases?.includes(db.type) || db.serviceName === svc.name) {
        const key = `e-service-${svc.name}-db-${db.type}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          const protocol = db.type.toUpperCase() === "REDIS" ? "REDIS" : "SQL";
          edges.push(buildEdge(key, `service-${svc.name}`, `db-${db.type}`, protocol, protocol));
        }
      }
    }
  }

  for (const api of apis) {
    const tgtService = services.find((s) => s.name !== api.serviceName && api.path?.includes(s.name));
    if (tgtService) {
      const key = `e-api-${api.serviceName}-${tgtService.name}-${api.method}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push(
          buildEdge(key, `service-${api.serviceName}`, `service-${tgtService.name}`, `${api.method.toUpperCase()} ${api.path}`, api.type.toUpperCase())
        );
      }
    }
  }

  // Event connections
  for (const evt of events) {
    const evtId = `evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(evtId)) {
      nodeIds.add(evtId);
      nodes.push(buildNode(evtId, evt.name, `Event: ${evt.type}`, evt.type, "queue", "queue", 0, { technologyIcon: evt.type, eventType: evt.type }));
    }
    const source = `service-${evt.serviceName}`;
    if (nodeIds.has(source)) {
      const key = `e-${source}-${evtId}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push(buildEdge(key, source, evtId, evt.type.toUpperCase(), "EVENT"));
      }
    }
  }

  return { nodes, edges };
}

export function transformUmlView(modules: DetectedModule[], services: DetectedService[]): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  // Group by service directory for better organization
  const moduleGroups = new Map<string, DetectedModule[]>();
  for (const mod of modules) {
    const dir = mod.sourceFile.split("/").slice(0, -1).join("/");
    if (!moduleGroups.has(dir)) moduleGroups.set(dir, []);
    moduleGroups.get(dir)!.push(mod);
  }

  for (const [, group] of moduleGroups) {
    for (const mod of group.slice(0, 20)) {
      const nid = `uml-${mod.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
      if (nodeIds.has(nid)) continue;
      nodeIds.add(nid);

      const isInterface = mod.type === "esm" && mod.exports.length > 0 && mod.imports.length === 0;
      nodes.push(
        buildNode(nid, mod.name, `Source: ${mod.sourceFile}`, "", isInterface ? "uml_interface" : "uml_class", "service", 0, {
          methods: mod.exports.slice(0, 20).map((e) => ({
            name: e,
            params: "...",
            returnType: "any",
            visibility: "public",
          })),
          properties: mod.imports.slice(0, 15).map((i) => ({
            name: i.split("/").pop() || i,
            type: i,
            visibility: "private",
          })),
          filePath: mod.sourceFile,
          interfaces: mod.exports.filter((e) => e[0] === e[0]?.toUpperCase()).slice(0, 5),
          classes: mod.exports.filter((e) => e[0] === e[0]?.toUpperCase()).slice(0, 5),
        })
      );
    }
  }

  for (const mod of modules) {
    const sourceId = `uml-${mod.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    for (const imp of mod.imports) {
      const targetName = imp.split("/").pop() || imp;
      const targetId = `uml-${targetName.replace(/[^a-zA-Z0-9]/g, "-")}`;
      if (nodeIds.has(targetId) && targetId !== sourceId) {
        const key = `e-${sourceId}-${targetId}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, sourceId, targetId, "depends on", "IMPORT"));
        }
      }
    }
  }

  return { nodes, edges };
}

export function transformInfrastructureView(
  infra: DetectedInfrastructure[],
  services: DetectedService[]
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  const typeClusters: Record<string, { name: string; nodes: { name: string; sourceFile: string; content: string }[] }> = {
    docker: { name: "Docker", nodes: [] },
    kubernetes: { name: "Kubernetes", nodes: [] },
    terraform: { name: "Terraform", nodes: [] },
    "ci-cd": { name: "CI/CD", nodes: [] },
    cloud: { name: "Cloud Providers", nodes: [] },
  };

  for (const inf of infra) {
    const cluster = typeClusters[inf.type];
    if (cluster) {
      cluster.nodes.push({ name: inf.name, sourceFile: inf.sourceFile, content: inf.content });
    }
    const nid = `infra-${inf.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(
        buildNode(nid, inf.name, `${inf.type}: ${inf.name}`, inf.type, inf.type === "cloud" ? "cloud" : "infrastructure", "infrastructure", 0, {
          filePath: inf.sourceFile,
          technologyIcon: inf.type,
          deploymentConfig: inf.content.substring(0, 300),
          group: inf.type,
        })
      );
    }
  }

  for (const svc of services) {
    for (const inf of infra) {
      const nid = `infra-${inf.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
      if (svc.sourcePath.includes(inf.name.split(".")[0])) {
        const key = `e-deploy-${svc.name}-${inf.name}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, `service-${svc.name}`, nid, "DEPLOYS_ON", "DEPLOY"));
        }
      }
    }
  }

  // Cluster grouping edges
  for (const [, cluster] of Object.entries(typeClusters)) {
    if (cluster.nodes.length > 1) {
      const clusterId = `cluster-${cluster.name.toLowerCase().replace(/\s+/g, "-")}`;
      if (!nodeIds.has(clusterId)) {
        nodeIds.add(clusterId);
        nodes.push(
          buildNode(clusterId, cluster.name, `${cluster.nodes.length} resources`, "", "infrastructure", "infrastructure", cluster.nodes.length, {
            technologyIcon: cluster.name,
            group: "cluster",
          })
        );
      }
      for (const infNode of cluster.nodes) {
        const nid = `infra-${infNode.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
        const key = `e-cluster-${clusterId}-${nid}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, clusterId, nid, "contains", "DEPLOY"));
        }
      }
    }
  }

  return { nodes, edges };
}

export function transformDataFlowView(
  services: DetectedService[],
  apis: DetectedApi[],
  events: DetectedEvent[],
  databases: DetectedDatabase[]
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  for (const svc of services) {
    const nid = `flow-${svc.name}`;
    nodeIds.add(nid);
    const endpoints = apis.filter((a) => a.serviceName === svc.name).map((a) => `${a.method} ${a.path}`);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, svc.type === "frontend" ? "frontend" : "backend", "service", svc.dependencies.length, {
        port: svc.port,
        technologyIcon: svc.technology,
        endpoints: endpoints.length > 0 ? endpoints : undefined,
      })
    );
  }

  for (const db of databases) {
    const nid = `flow-db-${db.type}${db.name ? `-${db.name}` : ""}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, db.name || db.type, `${db.type} Database`, db.type, "database", "database", 0, { technologyIcon: db.type }));
    }
  }

  for (const evt of events) {
    const nid = `flow-evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, evt.name, evt.type, evt.type, "queue", "queue", 0, { technologyIcon: evt.type, eventType: evt.type }));
    }
  }

  // API flows with direction
  for (const api of apis) {
    const source = `flow-${api.serviceName}`;
    if (!nodeIds.has(source)) continue;
    const target = `flow-${api.serviceName}`;
    const key = `e-flow-${api.serviceName}-${api.method}-${api.path}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push({
        id: key,
        source,
        target: source,
        type: "smoothstep",
        animated: true,
        label: `${api.method.toUpperCase()} ${api.path}`,
        style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: api.type === "websocket" ? "5 5" : undefined },
        labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: "#10b981" },
        data: { label: `${api.method} ${api.path}`, protocol: api.type.toUpperCase() },
      });
    }
  }

  // Event flows
  for (const evt of events) {
    const source = `flow-${evt.serviceName}`;
    const target = `flow-evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
    const key = `e-flow-ev-${source}-${target}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push(buildEdge(key, source, target, `PUBLISH ${evt.type.toUpperCase()}`, "EVENT"));
    }
  }

  // Database read/write flows
  for (const svc of services) {
    for (const db of databases) {
      if (svc.databases?.includes(db.type) || db.serviceName === svc.name) {
        const source = `flow-${svc.name}`;
        const target = `flow-db-${db.type}${db.name ? `-${db.name}` : ""}`;
        if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
        const key = `e-flow-db-${source}-${target}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push({
            id: key,
            source,
            target,
            type: "smoothstep",
            animated: true,
            label: db.type.toUpperCase(),
            style: { stroke: "#f59e0b", strokeWidth: 2.5 },
            labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: "#f59e0b" },
            data: { label: db.type.toUpperCase(), protocol: "SQL" },
          });
        }
      }
    }
  }

  return { nodes, edges };
}

export function transformDependencyView(
  services: DetectedService[],
  modules: DetectedModule[],
  events: DetectedEvent[]
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();
  const circularDeps = new Set<string>();

  for (const svc of services) {
    const nid = `dep-${svc.name}`;
    nodeIds.add(nid);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, "service", "service", svc.dependencies.length, {
        dependencies: svc.dependencies,
        technologyIcon: svc.technology,
      })
    );
  }

  for (const mod of modules) {
    const srcService = services.find((s) => mod.sourceFile.startsWith(s.sourcePath.split("/").slice(0, -1).join("/")));
    if (!srcService) continue;
    for (const imp of mod.imports) {
      const tgtService = services.find(
        (s) => imp === s.name || imp.startsWith(s.name + "/") || imp.includes(s.name)
      );
      if (tgtService && tgtService.name !== srcService.name) {
        const key = `e-dep-${srcService.name}-dep-${tgtService.name}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, `dep-${srcService.name}`, `dep-${tgtService.name}`, "IMPORTS", "IMPORT"));
        }
      }
    }
  }

  // Detect circular dependencies
  const adjacency = new Map<string, string[]>();
  for (const svc of services) {
    adjacency.set(svc.name, []);
  }
  for (const edge of edges) {
    const src = edge.source.replace("dep-", "");
    const tgt = edge.target.replace("dep-", "");
    if (adjacency.has(src)) adjacency.get(src)!.push(tgt);
  }
  for (const svc of services) {
    const visited = new Set<string>();
    const stack = new Set<string>();
    function dfs(name: string) {
      if (stack.has(name)) { circularDeps.add(name); return; }
      if (visited.has(name)) return;
      visited.add(name);
      stack.add(name);
      for (const neighbor of adjacency.get(name) || []) {
        dfs(neighbor);
      }
      stack.delete(name);
    }
    dfs(svc.name);
  }

  const allDeps = services.flatMap((s) => s.dependencies);
  const depCounts = new Map<string, number>();
  for (const d of allDeps) {
    depCounts.set(d, (depCounts.get(d) || 0) + 1);
  }

  // Show shared external deps
  const externalDeps = Array.from(depCounts.entries()).filter(([_, count]) => count >= 2);
  for (const [dep, count] of externalDeps) {
    const nid = `lib-${dep}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, dep, `Used by ${count} services`, dep, "library", "library", 0, { technologyIcon: dep }));
    }
    for (const svc of services) {
      if (svc.dependencies.includes(dep)) {
        const key = `e-dep-${svc.name}-${nid}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, `dep-${svc.name}`, nid, "USES", "IMPORT"));
        }
      }
    }
  }

  // Add circular dep warnings
  for (const svcName of circularDeps) {
    const nid = `dep-${svcName}`;
    const existing = nodes.find((n) => n.id === nid);
    if (existing) {
      existing.data = { ...existing.data, risk: "circular dependency", severity: "warning", health: { score: 40, issues: ["Circular dependency detected"] } };
    }
  }

  return { nodes, edges };
}

export function transformSecurityView(
  envVars: string[],
  services: DetectedService[],
  files: Array<{ path: string; language: string }>
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();

  // Classify env vars
  const highRisk: string[] = [];
  const mediumRisk: string[] = [];
  const lowRisk: string[] = [];

  for (const env of envVars) {
    const upper = env.toUpperCase();
    if (upper.includes("SECRET") || upper.includes("KEY") || upper.includes("TOKEN") || upper.includes("PASSWORD") || upper.includes("PRIVATE")) {
      highRisk.push(env);
    } else if (upper.includes("URL") || upper.includes("HOST") || upper.includes("PORT") || upper.includes("DATABASE") || upper.includes("CONNECTION")) {
      mediumRisk.push(env);
    } else if (upper.includes("DEBUG") || upper.includes("LOG") || upper.includes("LEVEL") || upper.includes("NODE_ENV") || upper.includes("ENV")) {
      lowRisk.push(env);
    }
  }

  if (highRisk.length > 0) {
    nodes.push(buildNode("sec-high-risk", `High Risk (${highRisk.length})`, "Credentials that should be in a secrets manager", "", "security", "infrastructure", highRisk.length, {
      severity: "HIGH",
      envVars: highRisk,
      recommendation: "Move all credentials to environment variables or a secrets manager",
    }));
    nodeIds.add("sec-high-risk");
  }

  if (mediumRisk.length > 0) {
    nodes.push(buildNode("sec-medium-risk", `Medium Risk (${mediumRisk.length})`, "Connection details that could leak infrastructure topology", "", "env_var", "infrastructure", mediumRisk.length, {
      severity: "MEDIUM",
      envVars: mediumRisk,
    }));
    nodeIds.add("sec-medium-risk");
  }

  if (lowRisk.length > 0) {
    nodes.push(buildNode("sec-low-risk", `Low Risk (${lowRisk.length})`, "Configuration flags safe to expose", "", "config", "infrastructure", lowRisk.length, {
      severity: "LOW",
      envVars: lowRisk,
    }));
    nodeIds.add("sec-low-risk");
  }

  // Per-service env analysis
  for (const svc of services) {
    if (!svc.envVars || svc.envVars.length === 0) continue;
    const nid = `sec-svc-${svc.name}`;
    if (nodeIds.has(nid)) continue;
    nodeIds.add(nid);
    nodes.push(buildNode(nid, svc.name, `${svc.envVars.length} env vars`, svc.technology, "service", "service", svc.envVars.length, {
      technologyIcon: svc.technology,
      envVars: svc.envVars,
      risk: svc.envVars.some((e) => /secret|key|token|password/i.test(e)) ? "contains credentials" : "safe",
    }));
  }

  // File scanning info
  if (files.length > 0) {
    nodes.push(buildNode("sec-files", `${files.length} files scanned`, "Repository files checked for secrets", "", "infrastructure", "infrastructure", files.length, {
      confidence: 100,
      health: { score: 90, issues: [] },
    }));
    nodeIds.add("sec-files");
  }

  // Edge connections
  for (const svc of services) {
    if (!svc.envVars || svc.envVars.length === 0) continue;
    const svcId = `sec-svc-${svc.name}`;
    for (const env of svc.envVars) {
      let targetId = "sec-low-risk";
      const upper = env.toUpperCase();
      if (upper.includes("SECRET") || upper.includes("KEY") || upper.includes("TOKEN") || upper.includes("PASSWORD")) targetId = "sec-high-risk";
      else if (upper.includes("URL") || upper.includes("HOST") || upper.includes("DATABASE")) targetId = "sec-medium-risk";

      if (nodeIds.has(targetId)) {
        const key = `e-sec-${svc.name}-${env}`;
        edges.push(buildEdge(key, svcId, targetId, env, "IMPORT"));
      }
    }
  }

  return { nodes, edges };
}

export function transformTimelineView(
  analysis: Record<string, unknown> | null,
  services: DetectedService[],
  modules: DetectedModule[],
  files: Array<{ path: string; language: string }>
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();

  if (!analysis) return { nodes, edges };

  // Timeline milestones
  const milestones = [
    { id: "tl-imported", label: "Repository Imported", timestamp: analysis.createdAt as string || new Date().toISOString(), type: "import" },
    { id: "tl-analyzed", label: "Code Analyzed", timestamp: analysis.completedAt as string || new Date().toISOString(), type: "analysis" },
    { id: "tl-services", label: `${services.length} Services Detected`, timestamp: new Date().toISOString(), type: "detection" },
    { id: "tl-modules", label: `${modules.length} Modules Parsed`, timestamp: new Date().toISOString(), type: "parsing" },
    { id: "tl-files", label: `${files.length} Files Scanned`, timestamp: new Date().toISOString(), type: "scan" },
  ];

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    nodes.push(buildNode(m.id, m.label, `Event: ${m.type}`, "", "timeline_node", "infrastructure", 0, {
      timestamp: m.timestamp,
      changeType: m.type,
      version: `${i + 1}`,
    }));
    nodeIds.add(m.id);

    if (i > 0) {
      const prev = milestones[i - 1];
      const key = `e-tl-${prev.id}-${m.id}`;
      edges.push(buildEdge(key, prev.id, m.id, "→", "REQUEST"));
    }
  }

  return { nodes, edges };
}
