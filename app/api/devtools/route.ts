import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  testRegex,
  formatJson,
  formatYaml,
  encodeBase64,
  decodeBase64,
  decodeJWT,
  generateUUID,
  generateHash,
  parseCron,
  formatSql,
} from "@/lib/devtools";

export const dynamic = "force-dynamic";

const TOOL_HANDLERS: Record<string, (params: Record<string, unknown>) => unknown> = {
  regex: (params) => {
    const { pattern, flags, testString } = params as {
      pattern: string;
      flags?: string;
      testString: string;
    };
    if (!pattern || typeof pattern !== "string") throw new Error("pattern is required");
    if (!testString || typeof testString !== "string") throw new Error("testString is required");
    return testRegex(pattern, flags || "", testString);
  },
  json: (params) => {
    const { input } = params as { input: string };
    if (!input || typeof input !== "string") throw new Error("input is required");
    return formatJson(input);
  },
  yaml: (params) => {
    const { input } = params as { input: string };
    if (!input || typeof input !== "string") throw new Error("input is required");
    return formatYaml(input);
  },
  base64: (params) => {
    const { input, action } = params as { input: string; action: "encode" | "decode" };
    if (!input || typeof input !== "string") throw new Error("input is required");
    if (action === "decode") return decodeBase64(input);
    return { result: encodeBase64(input), error: null };
  },
  jwt: (params) => {
    const { token } = params as { token: string };
    if (!token || typeof token !== "string") throw new Error("token is required");
    return decodeJWT(token);
  },
  uuid: (params) => {
    const { format } = params as { format?: "v4" | "v7" };
    return { uuid: generateUUID(format || "v4") };
  },
  hash: (params) => {
    const { input, algorithm } = params as {
      input: string;
      algorithm?: "md5" | "sha1" | "sha256" | "sha512";
    };
    if (!input || typeof input !== "string") throw new Error("input is required");
    return { hash: generateHash(input, algorithm || "sha256"), algorithm: algorithm || "sha256" };
  },
  cron: (params) => {
    const { expression } = params as { expression: string };
    if (!expression || typeof expression !== "string") throw new Error("expression is required");
    return parseCron(expression);
  },
  sql: (params) => {
    const { input, dialect } = params as { input: string; dialect?: string };
    if (!input || typeof input !== "string") throw new Error("input is required");
    return formatSql(input, dialect || "postgresql");
  },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { tool, ...params } = body;

    if (!tool || typeof tool !== "string") {
      return NextResponse.json({ error: "tool is required" }, { status: 400 });
    }

    const handler = TOOL_HANDLERS[tool.toLowerCase()];
    if (!handler) {
      return NextResponse.json(
        {
          error: `Unknown tool: ${tool}. Supported tools: ${Object.keys(TOOL_HANDLERS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const result = handler(params);
    return NextResponse.json({ tool, result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run tool";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
