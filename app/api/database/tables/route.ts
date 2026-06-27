import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prisma = getPrisma();

    const tables = await prisma.$queryRaw<
      Array<{
        tablename: string;
        tableowner: string;
        tablespace: string | null;
        hasindexes: boolean;
        hasrules: boolean;
        hastriggers: boolean;
        rowsecurity: boolean;
      }>
    >`
      SELECT
        tablename,
        tableowner,
        tablespace,
        hasindexes,
        hasrules,
        hastriggers,
        rowsecurity
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const tableDetails = await Promise.all(
      tables.map(async (t) => {
        const columns = await prisma.$queryRaw<
          Array<{
            column_name: string;
            data_type: string;
            is_nullable: string;
            column_default: string | null;
            ordinal_position: number;
          }>
        >`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            ordinal_position
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${t.tablename}
          ORDER BY ordinal_position
        `;

        return {
          name: t.tablename,
          owner: t.tableowner,
          columns: columns.map((c) => ({
            name: c.column_name,
            type: c.data_type,
            nullable: c.is_nullable === "YES",
            default: c.column_default,
            position: c.ordinal_position,
          })),
        };
      })
    );

    return NextResponse.json({ tables: tableDetails });
  } catch (error) {
    console.error("Database tables error:", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}
