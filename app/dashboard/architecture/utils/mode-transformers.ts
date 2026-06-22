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
  { id: "uml", label: "UML View", icon: "Code2" },
  { id: "infrastructure", label: "Infrastructure", icon: "Box" },
  { id: "dataflow", label: "Data Flow", icon: "GitFork" },
  { id: "dependencies", label: "Dependencies", icon: "Package" },
] as const;

export type DiagramMode = (typeof DIAGRAM_MODES)[number]["id"];

const NODE_COLORS: Record<string, string> = {
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
};

export const LAYER_ORDER = [
  { key: "frontend", label: "Frontend", y: 0 },
  { key: "backend", label: "Backend / API Layer", y: 1 },
  { key: "service", label: "Services", y: 2 },
  { key: "queue", label: "Message Queues / Events", y: 3 },
  { key: "database", label: "Databases", y: 4 },
  { key: "infrastructure", label: "Infrastructure", y: 5 },
  { key: "library", label: "Libraries", y: 6 },
];

const PROTOCOL_COLORS: Record<string, string> = {
  REST: "#10b981",
  HTTP: "#10b981",
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
  };
}

export interface ModeEdge extends Edge {
  data: { label: string; protocol: string };
}

function buildNode(
  id: string,
  label: string,
  description: string,
  technology: string,
  nodeType: string,
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

  for (const svc of services) {
    const nid = `service-${svc.name}`;
    nodeIds.add(nid);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, svc.type, svc.dependencies.length, {
        filePath: svc.sourcePath,
        port: svc.port,
        envVars: svc.envVars,
        dependencies: svc.dependencies,
        databases: svc.databases,
        technologyIcon: svc.technology,
      })
    );
  }

  for (const db of databases) {
    const nid = `db-${db.type}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(
        buildNode(nid, db.type.charAt(0).toUpperCase() + db.type.slice(1), `${db.type} Database`, db.type, "database", 0, {
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
          edges.push(buildEdge(key, `service-${srcService.name}`, `service-${tgtService.name}`, "IMPORTS", "IMPORT"));
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
          edges.push(buildEdge(key, `service-${svc.name}`, `db-${db.type}`, db.type.toUpperCase(), "SQL"));
        }
      }
    }
  }

  for (const api of apis) {
    const tgtService = services.find((s) => s.name !== api.serviceName && api.path?.includes(s.name));
    if (tgtService) {
      const key = `e-service-${api.serviceName}-service-${tgtService.name}-${api.method}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push(
          buildEdge(
            key,
            `service-${api.serviceName}`,
            `service-${tgtService.name}`,
            `${api.method.toUpperCase()} ${api.path}`,
            api.type.toUpperCase()
          )
        );
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

  for (const mod of modules) {
    const nid = `uml-${mod.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (nodeIds.has(nid)) continue;
    nodeIds.add(nid);
    const isInterface = mod.type === "esm" && mod.exports.length > 0 && mod.imports.length === 0;
    nodes.push(
      buildNode(nid, mod.name, `Module: ${mod.sourceFile}`, "", isInterface ? "uml_interface" : "uml_class", 0, {
        methods: mod.exports.slice(0, 15).map((e) => ({
          name: e,
          params: "...",
          returnType: "any",
          visibility: "public",
        })),
        properties: mod.imports.slice(0, 10).map((i) => ({
          name: i.split("/").pop() || i,
          type: i,
          visibility: "private",
        })),
        filePath: mod.sourceFile,
      })
    );
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

  for (const inf of infra) {
    const nid = `infra-${inf.name}`;
    if (nodeIds.has(nid)) continue;
    nodeIds.add(nid);
    nodes.push(
      buildNode(nid, inf.name, `${inf.type}: ${inf.name}`, inf.type, "infrastructure", 0, {
        filePath: inf.sourceFile,
        technologyIcon: inf.type,
        deploymentConfig: inf.content.slice(0, 200),
      })
    );
  }

  for (const svc of services) {
    for (const inf of infra) {
      if (svc.sourcePath.includes(inf.name.split(".")[0])) {
        const key = `e-service-${svc.name}-infra-${inf.name}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, `service-${svc.name}`, `infra-${inf.name}`, "DEPLOYS_ON", "DEPLOY"));
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
    const nid = `svc-${svc.name}`;
    nodeIds.add(nid);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, svc.type, svc.dependencies.length, {
        port: svc.port,
        technologyIcon: svc.technology,
      })
    );
  }

  for (const db of databases) {
    const nid = `db-${db.type}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, db.type, `${db.type} Database`, db.type, "database", 0, { technologyIcon: db.type }));
    }
  }

  for (const evt of events) {
    const nid = `evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, evt.name, evt.type, evt.type, "queue", 0, { technologyIcon: evt.type }));
    }
  }

  for (const api of apis) {
    const source = `svc-${api.serviceName}`;
    const target = `svc-${api.serviceName}`;
    const key = `e-${source}-${target}-${api.method}-${api.path}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push(buildEdge(key, source, target, `${api.method} ${api.path}`, api.type.toUpperCase()));
    }
  }

  for (const evt of events) {
    const source = `svc-${evt.serviceName}`;
    const target = `evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    const key = `e-${source}-${target}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push(buildEdge(key, source, target, evt.type.toUpperCase(), "EVENT"));
    }
  }

  for (const svc of services) {
    for (const db of databases) {
      if (svc.databases?.includes(db.type) || db.serviceName === svc.name) {
        const key = `e-svc-${svc.name}-db-${db.type}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          edges.push(buildEdge(key, `svc-${svc.name}`, `db-${db.type}`, "QUERY", "SQL"));
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

  for (const svc of services) {
    const nid = `dep-${svc.name}`;
    nodeIds.add(nid);
    nodes.push(
      buildNode(nid, svc.name, svc.description, svc.technology, "service", svc.dependencies.length, {
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

  for (const evt of events) {
    const nid = `evt-${evt.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, evt.name, `Event: ${evt.type}`, evt.type, "queue", 0, { technologyIcon: evt.type }));
    }
    const source = `dep-${evt.serviceName}`;
    const key = `e-${source}-${nid}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      edges.push(buildEdge(key, source, nid, evt.type.toUpperCase(), "EVENT"));
    }
  }

  const allDeps = services.flatMap((s) => s.dependencies);
  const depCounts = new Map<string, number>();
  for (const d of allDeps) {
    depCounts.set(d, (depCounts.get(d) || 0) + 1);
  }
  const externalDeps = Array.from(depCounts.entries()).filter(([_, count]) => count >= 2);
  for (const [dep] of externalDeps) {
    const nid = `lib-${dep}`;
    if (!nodeIds.has(nid)) {
      nodeIds.add(nid);
      nodes.push(buildNode(nid, dep, `External library used by ${depCounts.get(dep)} services`, dep, "library", 0, { technologyIcon: dep }));
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

  return { nodes, edges };
}
