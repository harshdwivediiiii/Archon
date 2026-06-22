import { AnalysisResult, GraphNode, GraphEdge, DetectedModule } from "./types";

const NODE_TYPE_MAP: Record<string, string> = {
  frontend: "frontend",
  backend: "backend",
  database: "database",
  queue: "queue",
  worker: "service",
  infra: "infrastructure",
  service: "service",
  library: "library",
};

export function buildGraph(result: AnalysisResult): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const addedNodes = new Map<string, GraphNode>();

  // Build module lookup by import name
  const moduleByImport = new Map<string, DetectedModule[]>();
  for (const mod of result.modules) {
    for (const imp of mod.imports) {
      if (!moduleByImport.has(imp)) moduleByImport.set(imp, []);
      moduleByImport.get(imp)!.push(mod);
    }
  }

  for (const service of result.services) {
    const nodeId = `service-${service.name}`;
    if (!addedNodes.has(nodeId)) {
      const node: GraphNode = {
        id: nodeId,
        label: service.name,
        type: NODE_TYPE_MAP[service.type] || "service",
        description: service.description,
        technology: service.technology,
        dependencyCount: service.dependencies.length,
        properties: {
          technology: service.technology,
          port: service.port,
          sourcePath: service.sourcePath,
          envVars: service.envVars,
        },
      };
      nodes.push(node);
      addedNodes.set(nodeId, node);
    }
  }

  // Connect services based on actual imports from modules
  for (const mod of result.modules) {
    const sourceService = findServiceForFile(result.services, mod.sourceFile);
    if (!sourceService) continue;

    for (const imp of mod.imports) {
      const targetService = findServiceForImport(result.services, imp);
      if (targetService && targetService.name !== sourceService.name) {
        const sourceId = `service-${sourceService.name}`;
        const targetId = `service-${targetService.name}`;
        if (!edges.find((e) => e.source === sourceId && e.target === targetId)) {
          edges.push({
            source: sourceId,
            target: targetId,
            label: "IMPORTS",
            type: "dependency",
            protocol: "import",
          });
        }
      } else {
        // It's an external library import - create a library node
        const libName = imp.split("/")[0];
        const libNodeId = `lib-${libName}`;
        if (!addedNodes.has(libNodeId)) {
          const libNode: GraphNode = {
            id: libNodeId,
            label: libName,
            type: "library",
            description: `External library: ${libName}`,
            technology: libName,
            dependencyCount: 0,
            properties: {},
          };
          nodes.push(libNode);
          addedNodes.set(libNodeId, libNode);
        }
        const sourceId = `service-${sourceService.name}`;
        if (!edges.find((e) => e.source === sourceId && e.target === libNodeId)) {
          edges.push({
            source: sourceId,
            target: libNodeId,
            label: "IMPORTS",
            type: "dependency",
            protocol: "import",
          });
        }
      }
    }
  }

  // Add database nodes and connect them to services
  const dbToService = new Map<string, string[]>();
  for (const db of result.databases) {
    if (!dbToService.has(db.type)) {
      dbToService.set(db.type, []);
    }
    dbToService.get(db.type)!.push(db.serviceName);
  }

  for (const [dbType, serviceNames] of dbToService) {
    const dbNodeId = `db-${dbType}`;
    if (!addedNodes.has(dbNodeId)) {
      nodes.push({
        id: dbNodeId,
        label: dbType.charAt(0).toUpperCase() + dbType.slice(1),
        type: "database",
        description: `${dbType.charAt(0).toUpperCase() + dbType.slice(1)} Database`,
        technology: dbType,
        dependencyCount: 0,
        properties: {},
      });
      addedNodes.set(dbNodeId, null!);
    }

    for (const serviceName of serviceNames) {
      const serviceNodeId = `service-${serviceName}`;
      if (!edges.find((e) => e.source === serviceNodeId && e.target === dbNodeId)) {
        edges.push({
          source: serviceNodeId,
          target: dbNodeId,
          label: "CONNECTS_TO",
          type: "database",
          protocol: "SQL",
        });
      }
    }
  }

  // Add infrastructure nodes
  for (const infra of result.infra) {
    const infraNodeId = `infra-${infra.name}`;
    if (!addedNodes.has(infraNodeId)) {
      nodes.push({
        id: infraNodeId,
        label: infra.name,
        type: "infrastructure",
        description: `${infra.type.charAt(0).toUpperCase() + infra.type.slice(1)}: ${infra.name}`,
        technology: infra.type,
        dependencyCount: 0,
        properties: { type: infra.type },
      });
      addedNodes.set(infraNodeId, null!);
    }
  }

  // Connect services to infrastructure
  if (result.services.length > 0 && result.infra.length > 0) {
    for (const service of result.services) {
      for (const infra of result.infra) {
        if (service.sourcePath.includes(infra.name.split(".")[0])) {
          const sourceId = `service-${service.name}`;
          const targetId = `infra-${infra.name}`;
          if (!edges.find((e) => e.source === sourceId && e.target === targetId)) {
            edges.push({
              source: sourceId,
              target: targetId,
              label: "DEPLOYS_ON",
              type: "dependency",
              protocol: "deploy",
            });
          }
        }
      }
    }
  }

  // Connect services based on API relationships
  if (result.services.length > 1) {
    for (let i = 0; i < result.services.length; i++) {
      for (let j = 0; j < result.services.length; j++) {
        if (i === j) continue;
        const si = result.services[i];
        const sj = result.services[j];
        for (const api of si.apis) {
          const edgeKey = `${si.name}->${sj.name}`;
          if (api.path && !edges.find((e) => e.label === edgeKey)) {
            edges.push({
              source: `service-${si.name}`,
              target: `service-${sj.name}`,
              label: `API:${api.method}`,
              type: "api",
              protocol: api.type.toUpperCase(),
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

function findServiceForFile(
  services: AnalysisResult["services"],
  filePath: string
): AnalysisResult["services"][number] | null {
  for (const service of services) {
    if (filePath.startsWith(service.sourcePath.split("/").slice(0, -1).join("/"))) {
      return service;
    }
  }
  // Try matching by directory prefix
  const dirs = filePath.split("/");
  for (let i = dirs.length - 1; i >= 0; i--) {
    const prefix = dirs.slice(0, i).join("/");
    for (const service of services) {
      if (service.sourcePath.includes(prefix)) {
        return service;
      }
    }
  }
  return services[0] || null;
}

function findServiceForImport(
  services: AnalysisResult["services"],
  importPath: string
): AnalysisResult["services"][number] | null {
  for (const service of services) {
    if (importPath.includes(service.name) || service.name.includes(importPath)) {
      return service;
    }
  }
  return null;
}
