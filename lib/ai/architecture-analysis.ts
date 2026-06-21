// lib/ai/architecture-analysis.ts
import { getOpenAI } from "./openai";
import { getEnv } from "@/lib/env";

interface ArchitectureNode {
  id: string;
  label: string;
  type: string;
  [key: string]: unknown;
}

interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: unknown;
}

export async function analyzeArchitecture(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const openai = getOpenAI();
  const env = getEnv();
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert system architect. Analyze architecture diagrams and provide insights, recommendations, and identify potential issues.",
      },
      {
        role: "user",
        content: `Analyze this architecture:\nNodes: ${JSON.stringify(nodes)}\nEdges: ${JSON.stringify(edges)}`,
      },
    ],
  });

  return response.choices[0]?.message?.content || "";
}
