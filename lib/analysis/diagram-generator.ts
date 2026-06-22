import { AnalysisResult, GraphNode, GraphEdge, DetectedService } from "./types";

export interface RFNodeData {
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
}

export interface RFNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: RFNodeData;
  style?: Record<string, unknown>;
}

export interface RFEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  label: string;
  style?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  markerEnd?: { type: string; width: number; height: number; color: string };
}

const LAYER_ORDER = [
  { key: "frontend", label: "Frontend", y: 0 },
  { key: "backend", label: "Backend / API Layer", y: 1 },
  { key: "service", label: "Services", y: 2 },
  { key: "queue", label: "Message Queues / Events", y: 3 },
  { key: "database", label: "Databases", y: 4 },
  { key: "infrastructure", label: "Infrastructure", y: 5 },
  { key: "library", label: "Libraries", y: 6 },
];

const LAYER_SPACING = 260;
const NODE_SPACING = 260;

const NODE_COLORS: Record<string, string> = {
  frontend: "#3b82f6",
  backend: "#10b981",
  service: "#06b6d4",
  database: "#f59e0b",
  queue: "#ef4444",
  infrastructure: "#8b5cf6",
  library: "#6b7280",
};

function getServiceFunctions(service: DetectedService, result: AnalysisResult): string[] {
  const funcs: string[] = [];
  for (const mod of result.modules) {
    if (mod.sourceFile === service.sourcePath || service.sourcePath.includes(mod.name) || mod.name === service.name) {
      funcs.push(...mod.exports.slice(0, 10));
    }
  }
  return [...new Set(funcs)].slice(0, 8);
}

function getServiceClasses(service: DetectedService): string[] {
  const classes: string[] = [];
  const tech = service.technology?.toLowerCase() || "";
  if (tech.includes("nestjs") || tech.includes("nest")) classes.push("Module", "Controller", "Service");
  if (tech.includes("angular")) classes.push("Component", "Service", "Module");
  if (tech.includes("react")) classes.push("Component");
  if (tech.includes("python") || tech.includes("flask") || tech.includes("django")) classes.push("App", "Config");
  if (service.name.includes("model") || service.name.includes("Model")) classes.push("Model");
  if (service.name.includes("controller") || service.name.includes("Controller")) classes.push("Controller");
  if (service.name.includes("service") || service.name.includes("Service")) classes.push("Service");
  if (service.name.includes("repo") || service.name.includes("Repository")) classes.push("Repository");
  return classes.length > 0 ? classes : undefined as unknown as string[];
}

export function generateReactFlowDiagram(
  result: AnalysisResult,
  graph: { nodes: GraphNode[]; edges: GraphEdge[] }
): { nodes: RFNode[]; edges: RFEdge[] } {
  const rfNodes: RFNode[] = [];
  const rfEdges: RFEdge[] = [];
  const edgeSet = new Set<string>();
  const addedNodeIds = new Set<string>();

  const layerNodes: Record<string, GraphNode[]> = {};
  for (const layer of LAYER_ORDER) {
    layerNodes[layer.key] = [];
  }

  for (const node of graph.nodes) {
    const key = layerNodes[node.type] !== undefined ? node.type : "service";
    layerNodes[key].push(node);
  }

  for (const [layerIdx, layer] of LAYER_ORDER.entries()) {
    const nodes = layerNodes[layer.key];
    if (nodes.length === 0) continue;

    const totalWidth = (nodes.length - 1) * NODE_SPACING;
    const startX = -totalWidth / 2 + 400;

    nodes.forEach((node, index) => {
      if (addedNodeIds.has(node.id)) return;
      addedNodeIds.add(node.id);

      const service = result.services.find(
        (s) => `service-${s.name}` === node.id || s.name === node.label
      );

      let functions: string[] | undefined;
      let classes: string[] | undefined;
      let port: number | undefined;
      let envVars: string[] | undefined;

      if (service) {
        functions = getServiceFunctions(service, result);
        classes = getServiceClasses(service);
        port = service.port;
        envVars = service.envVars;
      }

      const color = NODE_COLORS[node.type] || "#6b7280";

      rfNodes.push({
        id: node.id,
        type: "default",
        position: {
          x: startX + index * NODE_SPACING,
          y: 80 + layerIdx * LAYER_SPACING,
        },
        data: {
          label: node.label,
          description: node.description,
          technology: node.technology || "",
          dependencyCount: node.dependencyCount || 0,
          nodeType: node.type,
          filePath: (node.properties?.sourcePath as string) || undefined,
          functions,
          classes,
          dependencies: service?.dependencies,
          port,
          envVars,
          technologyIcon: node.technology || "",
        },
        style: {
          border: `2px solid ${color}40`,
          borderRadius: "12px",
          background: `${color}08`,
        },
      });
    });
  }

  for (const edge of graph.edges) {
    const edgeKey = `${edge.source}->${edge.target}`;
    if (edgeSet.has(edgeKey)) continue;
    edgeSet.add(edgeKey);

    const isDbEdge = edge.type === "database";
    const isApiEdge = edge.type === "api";
    const isImportEdge = edge.label === "IMPORTS";

    let strokeColor = "#6366f1";
    let labelText = edge.label;

    if (isDbEdge) {
      strokeColor = "#f59e0b";
    } else if (isApiEdge) {
      strokeColor = "#10b981";
    } else if (isImportEdge) {
      strokeColor = "#6366f1";
    } else if (edge.protocol === "deploy") {
      strokeColor = "#8b5cf6";
      labelText = "DEPLOYS ON";
    }

    rfEdges.push({
      id: `e-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: !isDbEdge,
      label: labelText,
      style: { stroke: strokeColor, strokeWidth: isDbEdge ? 2.5 : 2 },
      labelStyle: {
        fill: "#a1a1aa",
        fontSize: 10,
        fontWeight: 500,
      },
      markerEnd: {
        type: "arrowclosed",
        width: 20,
        height: 20,
        color: strokeColor,
      },
    });
  }

  return { nodes: rfNodes, edges: rfEdges };
}
