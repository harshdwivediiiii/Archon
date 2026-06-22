export interface FlowNodeData {
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

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface DetectedService {
  name: string;
  type: string;
  technology: string;
  technologyVersion?: string;
  description: string;
  sourcePath: string;
  port?: number;
  apis: DetectedApi[];
  databases: string[];
  dependencies: string[];
  envVars: string[];
}

export interface DetectedApi {
  method: string;
  path: string;
  serviceName: string;
  auth: boolean;
  type: string;
  sourceFile: string;
}

export interface DetectedDatabase {
  type: string;
  name?: string;
  host?: string;
  port?: number;
  sourceFile: string;
  serviceName: string;
}

export interface DetectedInfrastructure {
  type: string;
  name: string;
  sourceFile: string;
  content: string;
}

export interface DetectedModule {
  name: string;
  type: string;
  exports: string[];
  imports: string[];
  sourceFile: string;
}

export interface DetectedEvent {
  name: string;
  type: string;
  sourceFile: string;
  serviceName: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  description: string;
  technology?: string;
  dependencyCount?: number;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  type: string;
  protocol: string;
}

export interface AiAnalysisData {
  pattern?: string;
  patterns?: ArchitectureInsight[];
  summary?: string;
  technologyStack?: TechInsight[];
  recommendations?: string[];
  enrichedDescriptions?: Record<string, string>;
  enrichedRelationships?: { source: string; target: string; description: string; type: string }[];
  architectureStyle?: string;
  complexity?: string;
  scalability?: string;
  services?: Record<string, string>;
}

export interface TechInsight {
  name: string;
  role: string;
}

export interface ArchitectureInsight {
  pattern: string;
  confidence: number;
  description: string;
}

export interface ServiceCommEdge {
  source: string;
  target: string;
  type: "rest" | "graphql" | "grpc" | "websocket" | "event";
  methods: string[];
  paths: string[];
}

export interface UMLClass {
  name: string;
  type: "class" | "interface" | "abstract";
  properties: { name: string; type: string; visibility: string }[];
  methods: { name: string; params: string; returnType: string; visibility: string }[];
  extends?: string;
  implements?: string[];
}

export interface ArchitectureSnapshot {
  id: string;
  name: string;
  description?: string;
  mode: string;
  nodes: unknown[];
  edges: unknown[];
  metadata?: Record<string, unknown>;
  commitSha?: string;
  branch?: string;
  tag?: string;
  analysisRun?: string;
  createdAt: string;
  repositoryId: string;
}

export interface SecurityFinding {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  category: string;
  title: string;
  description?: string;
  filePath: string;
  lineNumber?: number;
  codeSnippet?: string;
  risk?: string;
  recommendation?: string;
  dismissed: boolean;
  discoveredAt: string;
}
