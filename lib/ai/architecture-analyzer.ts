import { getOpenAI } from "./openai";
import { getEnv } from "@/lib/env";
import type { AnalysisResult, DetectedModule } from "@/lib/analysis/types";

export interface ArchitectureInsight {
  pattern: string;
  confidence: number;
  description: string;
}

export interface ArchitectureAnalysis {
  pattern: string;
  patterns: ArchitectureInsight[];
  summary: string;
  technologyStack: { name: string; role: string }[];
  recommendations: string[];
  enrichedDescriptions: Record<string, string>;
  enrichedRelationships: { source: string; target: string; description: string; type: string }[];
  architectureStyle: string;
  complexity: "low" | "medium" | "high";
  scalability: string;
}

function buildArchitectureContext(result: AnalysisResult): string {
  const sections: string[] = [];

  sections.push(`## Services (${result.services.length})`);
  for (const s of result.services) {
    sections.push(`- ${s.name}: type=${s.type}, tech=${s.technology}, path=${s.sourcePath}`);
    if (s.port) sections.push(`  port: ${s.port}`);
    if (s.apis.length > 0) {
      sections.push(`  apis: ${s.apis.map(a => `${a.method} ${a.path} (${a.type})`).join(", ")}`);
    }
    if (s.databases.length > 0) {
      sections.push(`  databases: ${s.databases.join(", ")}`);
    }
    if (s.dependencies.length > 0) {
      sections.push(`  deps: ${s.dependencies.slice(0, 10).join(", ")}`);
    }
    if (s.envVars.length > 0) {
      sections.push(`  env: ${s.envVars.join(", ")}`);
    }
  }

  if (result.apis.length > 0) {
    sections.push(`\n## APIs (${result.apis.length})`);
    for (const a of result.apis) {
      sections.push(`- ${a.method} ${a.path} (${a.type}, auth=${a.auth}) -> ${a.serviceName}`);
    }
  }

  if (result.databases.length > 0) {
    sections.push(`\n## Databases (${result.databases.length})`);
    for (const d of result.databases) {
      sections.push(`- ${d.type} ${d.name || ""} @ ${d.host || "local"} service=${d.serviceName}`);
    }
  }

  if (result.dependencies.length > 0) {
    sections.push(`\n## Dependencies (${result.dependencies.length})`);
    const seen = new Set<string>();
    for (const d of result.dependencies) {
      if (!seen.has(d.name)) {
        seen.add(d.name);
        sections.push(`- ${d.name}@${d.version} (${d.type})`);
      }
    }
  }

  if (result.infra.length > 0) {
    sections.push(`\n## Infrastructure (${result.infra.length})`);
    for (const i of result.infra) {
      sections.push(`- ${i.type}: ${i.name} (${i.sourceFile})`);
    }
  }

  if (result.events.length > 0) {
    sections.push(`\n## Events (${result.events.length})`);
    for (const e of result.events) {
      sections.push(`- ${e.name} (${e.type}) service=${e.serviceName}`);
    }
  }

  if (result.modules.length > 0) {
    sections.push(`\n## Modules (${result.modules.length})`);
    for (const m of result.modules.slice(0, 30)) {
      sections.push(`- ${m.name} (${m.type}) imports=${m.imports.length}, exports=${m.exports.length}`);
    }
  }

  return sections.join("\n");
}

export async function analyzeArchitecture(result: AnalysisResult): Promise<ArchitectureAnalysis> {
  const context = buildArchitectureContext(result);
  const openai = getOpenAI();
  const env = getEnv();

  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert software architect analyzing a repository. 

Return a JSON object with these fields:
- "pattern": overall architecture pattern (e.g., "microservices", "monolithic", "layered", "event-driven", "hexagonal", "serverless", "hybrid")
- "patterns": array of { "pattern": string, "confidence": number (0-1), "description": string }
- "summary": 2-3 sentence architecture summary
- "technologyStack": array of { "name": string, "role": string } (each detected tech with its role)
- "recommendations": array of strings (architecture improvements, max 5)
- "enrichedDescriptions": object mapping service name to an enhanced description (1-2 sentences covering its role, tech, and what it does)
- "enrichedRelationships": array of { "source": string, "target": string, "description": string, "type": string } (connections between services beyond static imports, e.g., API calls, data flow, events)
- "architectureStyle": one of "Microservices", "Monolithic", "Layered", "Event-Driven", "Hexagonal/Clean", "Serverless", "Hybrid"
- "complexity": "low" | "medium" | "high"
- "scalability": one-sentence assessment of scalability`,
      },
      {
        role: "user",
        content: `Analyze this repository architecture:\n\n${context}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    pattern: parsed.pattern || "Unknown",
    patterns: parsed.patterns || [],
    summary: parsed.summary || "",
    technologyStack: parsed.technologyStack || [],
    recommendations: parsed.recommendations || [],
    enrichedDescriptions: parsed.enrichedDescriptions || {},
    enrichedRelationships: parsed.enrichedRelationships || [],
    architectureStyle: parsed.architectureStyle || "Unknown",
    complexity: parsed.complexity || "medium",
    scalability: parsed.scalability || "Not assessed",
  };
}

export function buildAiContextPrompt(modules: DetectedModule[]): string {
  const importGraph: string[] = [];
  for (const mod of modules) {
    for (const imp of mod.imports) {
      const resolved = imp.split("/")[0];
      if (resolved !== "." && resolved !== "..") {
        importGraph.push(`${mod.name} -> ${resolved}`);
      }
    }
  }
  return importGraph.slice(0, 100).join("\n");
}
