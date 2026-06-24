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
import {
  EDGE_COLORS, DIAGRAM_MODES, LAYER_DEFINITIONS,
} from "@/components/architecture/theme";
export type { DiagramMode } from "@/components/architecture/theme";
export { DIAGRAM_MODES, LAYER_DEFINITIONS as LAYER_ORDER };

export const NODE_COLORS_OLD: Record<string, string> = {
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
    services?: string[];
    datasets?: string[];
    features?: string[];
    models?: string[];
    nodes?: number;
    edges?: number;
    [key: string]: unknown;
  };
}

export interface ModeEdge extends Edge {
  data?: { label: string; protocol: string; packets?: number };
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
    type: nodeType,
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
  protocol: string,
  packets = 3,
  animated = true
): ModeEdge {
  const color = EDGE_COLORS[protocol]?.stroke || EDGE_COLORS.DEFAULT.stroke;
  return {
    id,
    source,
    target,
    type: "animatedSmoothStep",
    animated,
    style: {
      stroke: color,
      strokeWidth: 1.5,
      strokeDasharray: EDGE_COLORS[protocol]?.dash || "none",
      opacity: 0.6,
    },
    labelStyle: { fill: "#a1a1aa", fontSize: 10, fontWeight: 500 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color,
    },
    data: { label, protocol, packets },
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

  if (apis.length > 0 || services.length > 0) {
    nodes.push(buildNode("client", "Web / Mobile Clients", "Users accessing the system", "Browser", "frontend", "client", 0, { technologyIcon: "React" }));
    nodeIds.add("client");

    nodes.push(buildNode("cdn", "CDN", "Content Delivery Network", "CloudFront", "cdn", "cdn", 0, { technologyIcon: "AWS", endpoints: ["/*"] }));
    nodeIds.add("cdn");

    nodes.push(buildNode("gateway", "API Gateway", "API Gateway / Load Balancer", "ALB", "gateway", "gateway", 0, {
      technologyIcon: "NGINX",
      port: 443,
      endpoints: apis.slice(0, 5).map((a) => `${a.method} ${a.path}`),
    }));
    nodeIds.add("gateway");

    edgeKeys.add("e-client-cdn");
    edges.push(buildEdge("e-client-cdn", "client", "cdn", "HTTPS", "HTTPS", 4));
    edgeKeys.add("e-cdn-gateway");
    edges.push(buildEdge("e-cdn-gateway", "cdn", "gateway", "HTTPS", "HTTPS", 4));
  }

  for (const svc of services) {
    const nid = `service-${svc.name}`;
    nodeIds.add(nid);
    const layer = svc.type === "frontend" ? "frontend" : svc.type === "queue" ? "queue" : "service";
    const ep = apis.filter((a) => a.serviceName === svc.name).map((a) => `${a.method} ${a.path}`);
    const nodeType = svc.type === "frontend" ? "frontend" : "service";
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, nodeType, layer, svc.dependencies.length, {
        filePath: svc.sourcePath,
        port: svc.port,
        envVars: svc.envVars,
        dependencies: svc.dependencies,
        databases: svc.databases,
        technologyIcon: svc.technology,
        endpoints: ep.length > 0 ? ep : undefined,
      })
    );

    if (nodeIds.has("gateway") && svc.type !== "frontend") {
      const gk = `e-gateway-${nid}`;
      if (!edgeKeys.has(gk)) {
        edgeKeys.add(gk);
        edges.push(buildEdge(gk, "gateway", nid, svc.port ? `:${svc.port}` : "PROXY", "PROXY", 2));
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
          edges.push(buildEdge(key, `service-${srcService.name}`, `service-${tgtService.name}`,
            imp.includes("grpc") ? "gRPC" : imp.includes("graphql") ? "GraphQL" : "REST",
            imp.includes("grpc") ? "GRPC" : imp.includes("graphql") ? "GRAPHQL" : "REST", 3));
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
          edges.push(buildEdge(key, `service-${svc.name}`, `db-${db.type}${db.name ? `-${db.name}` : ""}`, protocol, protocol, 2));
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
        edges.push(buildEdge(key, `service-${api.serviceName}`, `service-${tgtService.name}`,
          `${api.method.toUpperCase()} ${api.path}`, api.type.toUpperCase(), 2));
      }
    }
  }

  for (const evt of events) {
    const evtId = `evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(evtId)) {
      nodeIds.add(evtId);
      nodes.push(buildNode(evtId, evt.name, `Event: ${evt.type}`, evt.type, "event", "queue", 0, {
        technologyIcon: evt.type,
        eventType: evt.type,
      }));
    }
    const source = `service-${evt.serviceName}`;
    if (nodeIds.has(source)) {
      const key = `e-${source}-${evtId}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push(buildEdge(key, source, evtId, evt.type.toUpperCase(), "EVENT", 4));
      }
    }
  }

  return { nodes, edges };
}

export function transformUmlView(modules: DetectedModule[]): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

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
          methods: mod.exports.slice(0, 20).map((e) => ({ name: e, params: "...", returnType: "any", visibility: "public" })),
          properties: mod.imports.slice(0, 15).map((i) => ({ name: i.split("/").pop() || i, type: i, visibility: "private" })),
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
          edges.push(buildEdge(key, sourceId, targetId, "depends on", "IMPORT", 1));
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
    docker: { name: "Docker Containers", nodes: [] },
    kubernetes: { name: "Kubernetes", nodes: [] },
    terraform: { name: "Terraform", nodes: [] },
    "ci-cd": { name: "CI/CD Pipeline", nodes: [] },
    cloud: { name: "Cloud Providers", nodes: [] },
  };

  for (const inf of infra) {
    const cluster = typeClusters[inf.type];
    if (cluster) cluster.nodes.push({ name: inf.name, sourceFile: inf.sourceFile, content: inf.content });
    const nid = `infra-${inf.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(
        buildNode(nid, inf.name, `${inf.type}: ${inf.name}`, inf.type, "infrastructure", "infrastructure", 0, {
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
          edges.push(buildEdge(key, `service-${svc.name}`, nid, "DEPLOYS_ON", "DEPLOY", 2));
        }
      }
    }
  }

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
          edges.push(buildEdge(key, clusterId, nid, "contains", "DEPLOY", 1));
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

  nodes.push(buildNode("flow-client", "Browser", "User Agent", "Chrome", "frontend", "client", 0, { technologyIcon: "React" }));
  nodeIds.add("flow-client");

  nodes.push(buildNode("flow-gateway", "API Gateway", "Entry Point", "NGINX", "gateway", "gateway", 0, { technologyIcon: "NGINX", port: 443 }));
  nodeIds.add("flow-gateway");

  edges.push(buildEdge("e-flow-client-gw", "flow-client", "flow-gateway", "HTTPS", "HTTPS", 4));

  for (const svc of services) {
    const nid = `flow-${svc.name}`;
    nodeIds.add(nid);
    const ep = apis.filter((a) => a.serviceName === svc.name).map((a) => `${a.method} ${a.path}`);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, "service", "service", svc.dependencies.length, {
        port: svc.port,
        technologyIcon: svc.technology,
        endpoints: ep.length > 0 ? ep : undefined,
      })
    );

    const gwKey = `e-flow-gw-${nid}`;
    if (!edgeKeys.has(gwKey)) {
      edgeKeys.add(gwKey);
      edges.push(buildEdge(gwKey, "flow-gateway", nid, svc.port ? `:${svc.port}` : "PROXY", "REQUEST", 3));
    }
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

  for (const svc of services) {
    for (const db of databases) {
      if (svc.databases?.includes(db.type) || db.serviceName === svc.name) {
        const source = `flow-${svc.name}`;
        const target = `flow-db-${db.type}${db.name ? `-${db.name}` : ""}`;
        if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
        const readKey = `e-flow-read-${source}-${target}`;
        if (!edgeKeys.has(readKey)) {
          edgeKeys.add(readKey);
          edges.push(buildEdge(readKey, source, target, `READ ${db.type.toUpperCase()}`, "READ", 2));
        }
        const writeKey = `e-flow-write-${source}-${target}`;
        if (!edgeKeys.has(writeKey)) {
          edgeKeys.add(writeKey);
          edges.push(buildEdge(writeKey, target, source, `WRITE ${db.type.toUpperCase()}`, "WRITE", 2));
        }
      }
    }
  }

  for (const evt of events) {
    const source = `flow-${evt.serviceName}`;
    const target = `flow-evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
    const key = `e-flow-ev-${source}-${target}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push(buildEdge(key, source, target, `PUBLISH ${evt.type.toUpperCase()}`, "PUBLISH", 3));
    }
  }

  return { nodes, edges };
}

export function transformEventFlowView(
  events: DetectedEvent[],
  services: DetectedService[]
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  const eventMap = new Map<string, { publishers: string[]; consumers: string[]; name: string; type: string }>();
  for (const evt of events) {
    if (!eventMap.has(evt.name)) {
      eventMap.set(evt.name, { publishers: [], consumers: [], name: evt.name, type: evt.type });
    }
    eventMap.get(evt.name)!.publishers.push(evt.serviceName);
  }

  for (const [, event] of eventMap) {
    const evtId = `evt-${event.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(evtId)) {
      nodeIds.add(evtId);
      nodes.push(buildNode(evtId, event.name, `Type: ${event.type}`, event.type, "event", "queue", event.publishers.length, {
        eventType: event.type,
        technologyIcon: event.type,
        services: event.publishers,
      }));
    }

    for (const pub of event.publishers) {
      const svc = services.find((s) => s.name === pub);
      if (!svc) continue;
      const svcId = `evt-svc-${pub}`;
      if (!nodeIds.has(svcId)) {
        nodeIds.add(svcId);
        nodes.push(buildNode(svcId, pub, svc.description, svc.technology, "backend", "service", 0, { technologyIcon: svc.technology }));
      }
      const pubKey = `evt-pub-${pub}-${event.name}`;
      if (!edgeKeys.has(pubKey)) {
        edgeKeys.add(pubKey);
        edges.push(buildEdge(pubKey, svcId, evtId, `PUBLISH ${event.type.toUpperCase()}`, "PUBLISH", 4));
      }
    }

    for (const consumer of event.publishers) {
      const consSvc = services.find((s) => s.name === consumer);
      if (!consSvc) continue;
      const svcId = `evt-svc-${consumer}`;
      const subKey = `evt-sub-${event.name}-${consumer}`;
      if (!edgeKeys.has(subKey)) {
        edgeKeys.add(subKey);
        edges.push(buildEdge(subKey, evtId, svcId, `SUBSCRIBE ${event.type.toUpperCase()}`, "SUBSCRIBE", 3));
      }
    }

    const dlqId = `evt-dlq-${event.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(dlqId)) {
      nodeIds.add(dlqId);
      nodes.push(buildNode(dlqId, `${event.name} (DLQ)`, `Dead Letter Queue for ${event.name}`, event.type, "queue", "queue", 0, {
        eventType: "dead_letter",
        risk: "failed messages",
      }));
    }
    const dlqKey = `evt-dlq-${event.name}`;
    if (!edgeKeys.has(dlqKey)) {
      edgeKeys.add(dlqKey);
      edges.push(buildEdge(dlqKey, evtId, dlqId, "FAIL → DLQ", "EVENT", 2));
    }
  }

  return { nodes, edges };
}

export function transformSearchView(
  services: DetectedService[],
  databases: DetectedDatabase[]
): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();

  const searchService = services.find((s) =>
    s.technology?.toLowerCase().includes("elasticsearch") ||
    s.technology?.toLowerCase().includes("meilisearch") ||
    s.technology?.toLowerCase().includes("algolia") ||
    s.technology?.toLowerCase().includes("typesense") ||
    s.name?.toLowerCase().includes("search")
  );

  nodes.push(buildNode("search-client", "Search Client", "User search requests", "Browser", "frontend", "client", 0, { technologyIcon: "React" }));
  nodeIds.add("search-client");

  nodes.push(buildNode("search-gateway", "Search API Gateway", "Query entry point", "NGINX", "gateway", "gateway", 0, { technologyIcon: "NGINX" }));
  nodeIds.add("search-gateway");

  nodes.push(buildNode("search-service", searchService?.name || "Search Service", "Full-text search and indexing", searchService?.technology || "Elasticsearch", "search", "search", 0, {
    technologyIcon: "elasticsearch",
    endpoints: ["GET /search", "POST /index", "PUT /documents"],
  }));
  nodeIds.add("search-service");

  nodes.push(buildNode("search-indexer", "Indexing Service", "Document indexing pipeline", "Logstash", "search", "search", 0, { technologyIcon: "elasticsearch" }));
  nodeIds.add("search-indexer");

  nodes.push(buildNode("search-cluster", "Search Cluster", "Distributed search nodes", "Elasticsearch", "search", "search", 0, {
    technologyIcon: "elasticsearch",
    metrics: [{ label: "shards", value: "12", color: "#f97316" }, { label: "replicas", value: "3", color: "#3b82f6" }],
  }));
  nodeIds.add("search-cluster");

  const sqlDb = databases.find((d) => d.type.toLowerCase() === "postgresql" || d.type.toLowerCase() === "postgres");
  if (sqlDb) {
    nodes.push(buildNode("search-db", sqlDb.name || "SQL Store", "Primary data store", sqlDb.type, "database", "database", 0, { technologyIcon: sqlDb.type }));
    nodeIds.add("search-db");
  }

  nodes.push(buildNode("search-cache", "Search Cache", "Query result cache", "Redis", "cache", "cache", 0, { technologyIcon: "Redis" }));
  nodeIds.add("search-cache");

  edges.push(buildEdge("se-client-gw", "search-client", "search-gateway", "HTTPS", "HTTPS", 4));
  edges.push(buildEdge("se-gw-svc", "search-gateway", "search-service", "QUERY", "REQUEST", 3));
  edges.push(buildEdge("se-svc-cache", "search-service", "search-cache", "cache lookup", "READ", 3));
  edges.push(buildEdge("se-svc-cluster", "search-service", "search-cluster", "search query", "QUERY", 4));
  edges.push(buildEdge("se-indexer-cluster", "search-indexer", "search-cluster", "index documents", "WRITE", 3));
  if (nodeIds.has("search-db")) {
    edges.push(buildEdge("se-svc-db", "search-service", "search-db", "read/write", "SQL", 2));
  }

  return { nodes, edges };
}

export function transformMlPipelineView(): { nodes: ModeNode[]; edges: ModeEdge[] } {
  const nodes: ModeNode[] = [];
  const edges: ModeEdge[] = [];
  const nodeIds = new Set<string>();

  nodes.push(buildNode("ml-data-sources", "Data Sources", "Application data, logs, events", "Kafka", "ml", "ai", 0, { technologyIcon: "Kafka" }));
  nodeIds.add("ml-data-sources");

  nodes.push(buildNode("ml-ingestion", "Batch Ingestion", "ETL pipeline for feature processing", "Spark", "ml", "ai", 0, { technologyIcon: "Python" }));
  nodeIds.add("ml-ingestion");

  nodes.push(buildNode("ml-data-lake", "Data Lake", "Raw structured & unstructured data", "S3", "infrastructure", "infrastructure", 0, { technologyIcon: "AWS" }));
  nodeIds.add("ml-data-lake");

  nodes.push(buildNode("ml-features", "Feature Engineering", "Feature computation and storage", "Python", "ml", "ai", 0, { technologyIcon: "Python" }));
  nodeIds.add("ml-features");

  nodes.push(buildNode("ml-training", "Model Training", "Distributed training pipeline", "PyTorch", "ml", "ai", 0, { technologyIcon: "Python" }));
  nodeIds.add("ml-training");

  nodes.push(buildNode("ml-evaluation", "Model Evaluation", "Validation, testing, benchmarking", "MLflow", "ml", "ai", 0, { technologyIcon: "Python" }));
  nodeIds.add("ml-evaluation");

  nodes.push(buildNode("ml-registry", "Model Registry", "Versioned model storage", "MLflow", "ml", "ai", 0, { technologyIcon: "AWS" }));
  nodeIds.add("ml-registry");

  nodes.push(buildNode("ml-serving", "Model Serving", "Real-time inference API", "FastAPI", "ml", "ai", 0, { technologyIcon: "FastAPI" }));
  nodeIds.add("ml-serving");

  nodes.push(buildNode("ml-monitoring", "Model Monitoring", "Performance, drift, and alerting", "Prometheus", "ml", "ai", 0, { technologyIcon: "Python" }));
  nodeIds.add("ml-monitoring");

  nodes.push(buildNode("ml-consumer", "Consumer Apps", "Applications consuming predictions", "Browser", "frontend", "client", 0, { technologyIcon: "React" }));
  nodeIds.add("ml-consumer");

  edges.push(buildEdge("ml-src-ingest", "ml-data-sources", "ml-ingestion", "stream", "KAFKA", 3));
  edges.push(buildEdge("ml-ingest-lake", "ml-ingestion", "ml-data-lake", "write", "WRITE", 3));
  edges.push(buildEdge("ml-lake-features", "ml-data-lake", "ml-features", "read", "READ", 2));
  edges.push(buildEdge("ml-features-train", "ml-features", "ml-training", "feature vectors", "DATAFLOW", 4));
  edges.push(buildEdge("ml-train-eval", "ml-training", "ml-evaluation", "model artifacts", "DATAFLOW", 3));
  edges.push(buildEdge("ml-eval-registry", "ml-evaluation", "ml-registry", "register model", "DATAFLOW", 2));
  edges.push(buildEdge("ml-registry-serve", "ml-registry", "ml-serving", "deploy model", "DEPLOY", 3));
  edges.push(buildEdge("ml-serve-consumer", "ml-serving", "ml-consumer", "predictions", "INFERENCE", 4));
  edges.push(buildEdge("ml-monitor-feedback", "ml-serving", "ml-monitoring", "metrics", "DATAFLOW", 2));
  edges.push(buildEdge("ml-monitor-features", "ml-monitoring", "ml-features", "drift feedback", "DATAFLOW", 1));

  return { nodes, edges };
}

export function transformDependencyView(
  services: DetectedService[],
  modules: DetectedModule[]
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
          edges.push(buildEdge(key, `dep-${srcService.name}`, `dep-${tgtService.name}`, "IMPORTS", "IMPORT", 2));
        }
      }
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const svc of services) adjacency.set(svc.name, []);
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
      for (const neighbor of adjacency.get(name) || []) dfs(neighbor);
      stack.delete(name);
    }
    dfs(svc.name);
  }

  const allDeps = services.flatMap((s) => s.dependencies);
  const depCounts = new Map<string, number>();
  for (const d of allDeps) depCounts.set(d, (depCounts.get(d) || 0) + 1);

  const externalDeps = Array.from(depCounts.entries()).filter(([, count]) => count >= 2);
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
          edges.push(buildEdge(key, `dep-${svc.name}`, nid, "USES", "IMPORT", 1));
        }
      }
    }
  }

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
    nodes.push(buildNode("sec-medium-risk", `Medium Risk (${mediumRisk.length})`, "Connection details that could leak infrastructure topology", "", "security", "infrastructure", mediumRisk.length, {
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

  if (files.length > 0) {
    nodes.push(buildNode("sec-files", `${files.length} files scanned`, "Repository files checked for secrets", "", "infrastructure", "infrastructure", files.length, {
      confidence: 100,
      health: { score: 90, issues: [] },
    }));
    nodeIds.add("sec-files");
  }

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
        edges.push(buildEdge(key, svcId, targetId, env, "IMPORT", 1));
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
      edges.push(buildEdge(key, prev.id, m.id, "→", "REQUEST", 2));
    }
  }

  return { nodes, edges };
}
