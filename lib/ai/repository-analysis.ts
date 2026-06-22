import { getOpenAI } from "./openai";
import { getEnv } from "@/lib/env";

export async function analyzeRepository(name: string, content: string): Promise<Record<string, unknown>> {
  const openai = getOpenAI();
  const env = getEnv();
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You analyze GitHub repositories and extract architecture information. Return JSON with services, dependencies, and architecture patterns.",
      },
      {
        role: "user",
        content: `Analyze this repository: ${name}\n\nContent:\n${content.slice(0, 10000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0]?.message?.content || "{}");
}
