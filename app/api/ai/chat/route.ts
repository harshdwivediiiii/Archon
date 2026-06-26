import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenAI } from "@/lib/ai/openai";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Archon AI, an expert architecture intelligence assistant. You help developers understand complex systems by:

1. Explaining architecture patterns and designs
2. Analyzing dependencies between services
3. Identifying potential issues in system design
4. Generating insights from repository analysis
5. Suggesting improvements to architecture

Keep responses concise, technical, and focused on architecture. Use markdown for code blocks and structure.`;

const MAX_MESSAGE_LENGTH = 4000;

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getEnv().OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI service is not configured. Please set OPENAI_API_KEY in your environment." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    const env = getEnv();
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      stream: true,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (streamError) {
          const errMsg = streamError instanceof Error ? streamError.message : "Stream error";
          controller.enqueue(encoder.encode(`\n\n_Error: ${errMsg}_`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const err = error as { status?: number; code?: string; message?: string; error?: string };
    const isQuotaError = err.status === 429 || err.code === "insufficient_quota";
    const isAuthError = err.status === 401;

    if (isQuotaError) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable due to rate limiting. Please try again later." },
        { status: 429 }
      );
    }

    if (isAuthError) {
      return NextResponse.json(
        { error: "AI service authentication failed. Please check your OpenAI API key configuration." },
        { status: 503 }
      );
    }

    console.error("AI chat error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
