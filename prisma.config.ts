import { defineConfig } from "@prisma/config";
import { getDirectDatabaseUrlFromEnv, loadEnvFiles } from "./lib/load-env";

loadEnvFiles();

/**
 * Prisma generate does not connect to the database, but prisma.config.ts still
 * requires a datasource URL. Use a fallback during CI/Vercel install when env
 * vars are not yet available so `prisma generate` can always succeed.
 */
const migrationUrl =
  getDirectDatabaseUrlFromEnv() ??
  process.env.DATABASE_URL ??
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
