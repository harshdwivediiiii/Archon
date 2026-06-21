// lib/ai/graph-generation.ts
import { getOpenAI } from "./openai";
import { getEnv } from "@/lib/env";

interface GraphNode {
  id: string;
  label: string;
  type: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export async function generateKnowledgeGraph(content: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const openai = getOpenAI();
  const env = getEnv();
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Generate a knowledge graph from the given content. Return JSON with nodes (id, label, type) and edges (source, target, label).",
      },
      {
        role: "user",
        content: content.slice(0, 15000),
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || "{}");
  return {
    nodes: result.nodes || [],
    edges: result.edges || [],
  };
}
