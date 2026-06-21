import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/health/diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await runHealthChecks();
    const statusCode =
      report.status === "failed" ? 503 : report.status === "warning" ? 200 : 200;

    return NextResponse.json(report, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "failed",
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 }
    );
  }
}
