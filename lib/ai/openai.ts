import OpenAI from "openai";
import { getEnv } from "@/lib/env";

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const env = getEnv();
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export type OpenAITestResult = {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  streaming?: boolean;
  error?: string;
};

export async function testOpenAIConnection(): Promise<OpenAITestResult> {
  const start = Date.now();
  try {
    const env = getEnv();
    const client = getOpenAI();
    const model = env.OPENAI_MODEL ?? "gpt-4o-mini";

    const stream = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
      max_tokens: 5,
      stream: true,
    });

    let received = "";
    for await (const chunk of stream) {
      received += chunk.choices[0]?.delta?.content ?? "";
      if (received.length > 0) break;
    }

    return {
      ok: received.length > 0,
      model,
      latencyMs: Date.now() - start,
      streaming: true,
      error: received.length > 0 ? undefined : "Stream returned no content",
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "OpenAI test failed",
    };
  }
}
