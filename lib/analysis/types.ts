export interface AnalyzedFile {
  path: string;
  language: string;
  size: number;
  lines: number;
}

export interface DetectedService {
  name: string;
  type: "frontend" | "backend" | "library" | "service" | "worker" | "queue";
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
  type: "rest" | "graphql" | "websocket" | "grpc";
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

export interface DetectedDependency {
  name: string;
  version: string;
  type: "dependency" | "devDependency" | "peerDependency";
  sourceFile: string;
}

export interface DetectedInfrastructure {
  type: "docker" | "kubernetes" | "terraform" | "ci-cd" | "serverless" | "cloud";
  name: string;
  sourceFile: string;
  content: string;
}

export interface DetectedModule {
  name: string;
  type: "esm" | "cjs" | "python" | "go" | "rust" | "java";
  exports: string[];
  imports: string[];
  sourceFile: string;
}

export interface DetectedEvent {
  name: string;
  type: "queue" | "pubsub" | "event-bus" | "stream";
  sourceFile: string;
  serviceName: string;
}

export interface AnalysisResult {
  services: DetectedService[];
  apis: DetectedApi[];
  databases: DetectedDatabase[];
  dependencies: DetectedDependency[];
  infra: DetectedInfrastructure[];
  modules: DetectedModule[];
  events: DetectedEvent[];
  files: AnalyzedFile[];
  codebaseMap: CodebaseMapNode;
}

export interface CodebaseMapNode {
  name: string;
  type: "directory" | "file";
  path: string;
  children?: CodebaseMapNode[];
  language?: string;
  size?: number;
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

export interface AnalysisProgress {
  analysisId: string;
  stage: string;
  progress: number;
  status: string;
  error?: string;
}
