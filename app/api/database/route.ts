import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma, checkDatabaseConnection } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const health = await checkDatabaseConnection();

    if (!health.ok) {
      return NextResponse.json({
        status: "disconnected",
        error: health.error,
        latencyMs: health.latencyMs,
      });
    }

    const prisma = getPrisma();

    const [tablesResult, dbInfo] = await Promise.all([
      prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `,
      prisma.$queryRaw<Array<{ name: string; version: string }>>`
        SELECT current_database() as name, version() as version
      `,
    ]);

    const tables = tablesResult.map((r) => r.tablename);

    const tableCounts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe<
          Array<{ count: bigint }>
        >(`SELECT COUNT(*) as count FROM "${table}"`);
        tableCounts[table] = Number(count[0]?.count ?? 0);
      } catch {
        tableCounts[table] = -1;
      }
    }

    return NextResponse.json({
      status: "connected",
      database: dbInfo[0]?.name ?? "unknown",
      serverVersion: dbInfo[0]?.version ?? "unknown",
      tables: tables.length,
      tableNames: tables,
      tableCounts,
      latencyMs: health.latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database overview error:", error);
    return NextResponse.json({ error: "Failed to fetch database info" }, { status: 500 });
  }
}
