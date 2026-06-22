import { prisma } from "@/lib/db/prisma";
import type { $Enums, Prisma } from "@prisma/client";
import { cloneRepository } from "./clone";
import { walkDirectory } from "./file-walker";
import { detectAll } from "./detectors/index";
import { parseAst, extractModules } from "./ast-parser";
import { buildGraph } from "./graph-builder";
import { generateReactFlowDiagram } from "./diagram-generator";
import { generateDocumentation } from "./doc-generator";
import { analyzeArchitecture } from "@/lib/ai/architecture-analyzer";
import { scanForSecrets } from "./security";
import {
  AnalysisResult,
  DetectedService,
  DetectedApi,
  DetectedDatabase,
  DetectedDependency,
  DetectedInfrastructure,
  DetectedModule,
  DetectedEvent,
  AnalysisProgress,
} from "./types";

type ProgressCallback = (progress: AnalysisProgress) => void;

export async function runAnalysis(
  repositoryId: string,
  fullName: string,
  cloneUrl: string,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  const updateProgress = async (stage: string, progress: number) => {
    const status =
      stage === "cloning"
        ? "CLONING"
        : stage === "analyzing"
          ? "ANALYZING"
          : stage === "graph"
            ? "BUILDING_GRAPH"
            : stage === "ai_analysis"
              ? "AI_ANALYSIS"
              : stage === "security"
                ? "ANALYZING"
                : stage === "diagrams"
                  ? "GENERATING_DIAGRAMS"
                  : stage === "docs"
                    ? "GENERATING_DOCS"
                    : "COMPLETED";

    await prisma.analysis.update({
      where: { repositoryId },
      data: { stage, progress, status: status as $Enums.AnalysisStatus },
    });

    onProgress?.({ analysisId: repositoryId, stage, progress, status });
  };

  const setError = async (error: string) => {
    await prisma.analysis.update({
      where: { repositoryId },
      data: { status: "FAILED", error, stage: "failed", progress: 0 },
    });
    onProgress?.({
      analysisId: repositoryId,
      stage: "failed",
      progress: 0,
      status: "FAILED",
      error,
    });
  };

  try {
    await prisma.analysis.update({
      where: { repositoryId },
      data: { status: "CLONING", stage: "cloning", progress: 0 },
    });

    await updateProgress("cloning", 10);
    const repoPath = await cloneRepository(fullName, cloneUrl, (_stage, percent) => {
      onProgress?.({
        analysisId: repositoryId,
        stage: "cloning",
        progress: Math.round(percent * 0.2),
        status: "CLONING",
      });
    });

    await updateProgress("analyzing", 25);
    const walkResult = walkDirectory(repoPath);

    const services: DetectedService[] = [];
    const apis: DetectedApi[] = [];
    const databases: DetectedDatabase[] = [];
    const dependencies: DetectedDependency[] = [];
    const infra: DetectedInfrastructure[] = [];
    const modules: DetectedModule[] = [];

    const totalFiles = walkResult.files.length;
    let processedFiles = 0;

    for (const [filePath, content] of walkResult.fileContents) {
      detectAll(filePath, content, services, apis, databases, dependencies, infra, modules);

      const ast = parseAst(filePath, content);
      if (ast) {
        const astModules = extractModules(filePath, content, ast);
        for (const mod of astModules) {
          const existing = modules.find((m) => m.sourceFile === mod.sourceFile);
          if (existing) {
            existing.exports = [...new Set([...existing.exports, ...mod.exports])];
            existing.imports = [...new Set([...existing.imports, ...mod.imports])];
          } else {
            modules.push(mod);
          }
        }

        const serviceName = filePath.split("/").pop()?.replace(/\.[^/.]+$/, "") || "unknown";
        const existingService = services.find(
          (s) => s.sourcePath === filePath
        );
        if (
          !existingService &&
          (ast.classes.length > 0 || ast.functions.length > 0) &&
          !filePath.includes("node_modules")
        ) {
          const tech =
            ast.decorators.includes("Module") || ast.decorators.includes("Controller")
              ? "NestJS"
              : ast.decorators.includes("Component") ||
                  ast.decorators.includes("Injectable")
                ? "Angular"
                : "Node.js";
          services.push({
            name: serviceName,
            type: "service",
            technology: tech,
            description: `Module: ${serviceName} (${ast.functions.length} functions, ${ast.classes.length} classes)`,
            sourcePath: filePath,
            apis: [],
            databases: [],
            dependencies: ast.imports,
            envVars: [],
          });
        }
      }

      processedFiles++;

      if (processedFiles % Math.max(1, Math.floor(totalFiles / 20)) === 0) {
        const analyzeProgress = Math.round(25 + (processedFiles / totalFiles) * 35);
        await updateProgress("analyzing", analyzeProgress);
      }
    }

    const events: DetectedEvent[] = detectEvents(services, walkResult.fileContents);

    const result: AnalysisResult = {
      services,
      apis,
      databases,
      dependencies,
      infra,
      modules,
      events,
      files: walkResult.files,
      codebaseMap: walkResult.codebaseMap,
    };

    await prisma.analysis.update({
      where: { repositoryId },
      data: {
        services: JSON.parse(JSON.stringify(services)),
        apis: JSON.parse(JSON.stringify(apis)),
        databases: JSON.parse(JSON.stringify(databases)),
        dependencies: JSON.parse(JSON.stringify(dependencies)),
        infra: JSON.parse(JSON.stringify(infra)),
        modules: JSON.parse(JSON.stringify(modules)),
        events: JSON.parse(JSON.stringify(events)),
        files: JSON.parse(JSON.stringify(walkResult.files)),
        codebaseMap: JSON.parse(JSON.stringify(walkResult.codebaseMap)),
      },
    });

    await updateProgress("graph", 65);
    const graph = buildGraph(result);

    const repoInfo = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { projectId: true, project: { select: { workspaceId: true } } },
    });

    if (repoInfo) {
      for (const node of graph.nodes) {
        await prisma.knowledgeNode.upsert({
          where: { id: node.id },
          update: {
            label: node.label,
            type: node.type,
            description: node.description,
            metadata: JSON.parse(JSON.stringify(node.properties)),
          },
          create: {
            id: node.id,
            label: node.label,
            type: node.type,
            description: node.description,
            metadata: JSON.parse(JSON.stringify(node.properties)),
            workspaceId: repoInfo.project.workspaceId,
          },
        });
      }

      for (const edge of graph.edges) {
        const exists = await prisma.knowledgeEdge.findFirst({
          where: { sourceId: edge.source, targetId: edge.target },
        });
        if (!exists) {
          await prisma.knowledgeEdge.create({
            data: {
              sourceId: edge.source,
              targetId: edge.target,
              label: edge.label,
              type: edge.type,
            },
          });
        }
      }
    }

    try {
      await updateProgress("ai_analysis", 75);
      const ai = await analyzeArchitecture(result);
      await prisma.analysis.update({
        where: { repositoryId },
        data: { aiAnalysis: JSON.parse(JSON.stringify(ai)) as Prisma.InputJsonValue },
      });
    } catch (err) {
      console.error("AI analysis failed (non-blocking):", err);
    }

    // Security scanning stage
    await updateProgress("security", 78);
    try {
      const currentAnalysis = await prisma.analysis.findUnique({ where: { repositoryId } });
      for (const [filePath, content] of walkResult.fileContents) {
        const findings = scanForSecrets(filePath, content);
        for (const finding of findings) {
          await prisma.securityFinding.upsert({
            where: { id: `${repositoryId}-${finding.filePath}-${finding.lineNumber || 0}` },
            create: {
              id: `${repositoryId}-${finding.filePath}-${finding.lineNumber || 0}`,
              severity: finding.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
              category: finding.category as "HARDCODED_SECRET" | "API_KEY" | "TOKEN" | "PASSWORD" | "PRIVATE_KEY" | "CONNECTION_STRING" | "EXPOSED_CREDENTIAL" | "UNSAFE_CONFIG" | "PUBLIC_RESOURCE" | "PRIVILEGE_ESCALATION",
              title: finding.title,
              description: finding.description,
              filePath: finding.filePath,
              lineNumber: finding.lineNumber,
              codeSnippet: finding.codeSnippet,
              risk: finding.risk,
              recommendation: finding.recommendation,
              repositoryId,
              analysisId: currentAnalysis?.id,
            },
            update: {},
          });
        }
      }
    } catch (err) {
      console.error("Security scanning failed (non-blocking):", err);
    }

    await updateProgress("diagrams", 80);
    const diagram = generateReactFlowDiagram(result, graph);

    // Remove old diagrams to prevent duplicate accumulation
    await prisma.diagram.deleteMany({
      where: {
        OR: [
          ...(repoInfo?.projectId ? [{ projectId: repoInfo.projectId }] : []),
          { metadata: { path: ["repositoryId"], equals: repositoryId } },
        ],
      },
    });

    await prisma.diagram.create({
      data: {
        name: `${fullName} - Architecture Diagram`,
        type: "architecture",
        nodes: JSON.parse(JSON.stringify(diagram.nodes)),
        edges: JSON.parse(JSON.stringify(diagram.edges)),
        metadata: { repositoryId, source: "analysis" },
        projectId: repoInfo?.projectId,
      },
    });

    await updateProgress("docs", 90);
    const documentation = generateDocumentation(result);

    await prisma.document.create({
      data: {
        title: `${fullName} - Architecture Documentation`,
        content: documentation,
        sourceType: "analysis",
        sourceUrl: cloneUrl,
        metadata: { repositoryId, analysisType: "architecture" },
        repositoryId,
      },
    });

    await prisma.repository.update({
      where: { id: repositoryId },
      data: { lastSyncedAt: new Date() },
    });

    await prisma.analysis.update({
      where: { repositoryId },
      data: { status: "COMPLETED", stage: "completed", progress: 100, completedAt: new Date() },
    });

    onProgress?.({
      analysisId: repositoryId,
      stage: "completed",
      progress: 100,
      status: "COMPLETED",
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    await setError(message);
    throw error;
  }
}

function detectEvents(
  services: DetectedService[],
  fileContents: Map<string, string>
): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const patterns: Array<{
    regex: RegExp;
    type: DetectedEvent["type"];
    name: string;
  }> = [
    { regex: /bull\b|@nest\/bull/i, type: "queue", name: "Bull Queue" },
    { regex: /kafka/i, type: "queue", name: "Kafka" },
    { regex: /rabbitmq/i, type: "queue", name: "RabbitMQ" },
    { regex: /sqs/i, type: "queue", name: "AWS SQS" },
    { regex: /pubsub/i, type: "pubsub", name: "Pub/Sub" },
    { regex: /EventEmitter/i, type: "event-bus", name: "EventEmitter" },
    { regex: /EventBus/i, type: "event-bus", name: "EventBus" },
    { regex: /redis.*pub/i, type: "pubsub", name: "Redis Pub/Sub" },
    { regex: /nats/i, type: "pubsub", name: "NATS" },
    { regex: /socket\.io/i, type: "stream", name: "Socket.IO" },
    { regex: /WebSocket/i, type: "stream", name: "WebSocket" },
    { regex: /@nestjs\/cqrs/i, type: "event-bus", name: "NestJS CQRS" },
  ];

  for (const [filePath, content] of fileContents) {
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        const serviceName =
          services.find((s) => filePath.startsWith(s.sourcePath.split("/").slice(0, -1).join("/")))
            ?.name || "unknown";
        if (!events.find((e) => e.name === pattern.name && e.serviceName === serviceName)) {
          events.push({
            name: pattern.name,
            type: pattern.type,
            sourceFile: filePath,
            serviceName,
          });
        }
      }
    }
  }
  return events;
}
