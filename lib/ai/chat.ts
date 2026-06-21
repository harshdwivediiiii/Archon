// lib/ai/chat.ts
import { getOpenAI } from "./openai";
import { getEnv } from "@/lib/env";

const SYSTEM_PROMPT = `You are Archon AI, an expert architecture intelligence assistant.`;

export async function createChatStream(messages: { role: "user" | "assistant"; content: string }[]) {
  const openai = getOpenAI();
  const env = getEnv();
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ],
    stream: true,
  });

  return response;
}
