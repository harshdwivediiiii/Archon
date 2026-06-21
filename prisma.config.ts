import { defineConfig } from "@prisma/config";
import { getDirectDatabaseUrlFromEnv, loadEnvFiles } from "./lib/load-env";

loadEnvFiles();

const migrationUrl = getDirectDatabaseUrlFromEnv();

if (!migrationUrl) {
  throw new Error(
    [
      "Missing database URL for Prisma migrations.",
      "Set DIRECT_DATABASE_URL (recommended for Supabase, port 5432) or DATABASE_URL in .env / .env.local.",
      "Prisma CLI does not load .env.local automatically unless prisma.config.ts imports lib/load-env.ts.",
    ].join(" ")
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
