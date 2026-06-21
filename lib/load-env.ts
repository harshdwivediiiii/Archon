import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

let loaded = false;

/**
 * Load environment files in the same order as Next.js:
 * .env → .env.local (overrides)
 *
 * Prisma CLI only auto-loads `.env`, so we call this from prisma.config.ts
 * and anywhere else that runs outside the Next.js runtime.
 */
export function loadEnvFiles(): void {
  if (loaded) return;

  const root = process.cwd();
  const envPath = resolve(root, ".env");
  const envLocalPath = resolve(root, ".env.local");

  if (existsSync(envPath)) {
    config({ path: envPath, quiet: true });
  }

  if (existsSync(envLocalPath)) {
    config({ path: envLocalPath, override: true, quiet: true });
  }

  loaded = true;
}

export function getDatabaseUrlFromEnv(): string | undefined {
  loadEnvFiles();
  return process.env.DATABASE_URL;
}

export function getDirectDatabaseUrlFromEnv(): string | undefined {
  loadEnvFiles();
  return (
    process.env.DIRECT_DATABASE_URL ??
    process.env.DATABASE_DIRECT_URL ??
    process.env.DATABASE_URL
  );
}
