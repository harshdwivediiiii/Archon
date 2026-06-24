import { z } from "zod";

const PLACEHOLDER_PATTERNS = [
  /YOUR-PASSWORD/i,
  /change-me/i,
  /placeholder/i,
  /xxx+/i,
];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

export type DatabaseInfo = {
  hostname: string;
  port: string;
  database: string;
  username: string;
  usesPooler: boolean;
};

export function parseDatabaseUrl(url: string): DatabaseInfo {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    username: parsed.username,
    usesPooler: parsed.searchParams.get("pgbouncer") === "true" || parsed.port === "6543",
  };
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "DATABASE_URL must be a valid PostgreSQL connection URL")
    .refine((value) => !isPlaceholder(value), {
      message:
        "DATABASE_URL contains a placeholder password. Replace it with your Supabase database password or use local PostgreSQL (see .env.example).",
    }),
  DIRECT_DATABASE_URL: z
    .string()
    .optional()
    .refine(
      (value) => !value || !isPlaceholder(value),
      "DIRECT_DATABASE_URL contains a placeholder password"
    ),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters")
    .refine((value) => !isPlaceholder(value), "AUTH_SECRET must be a secure random string"),
  AUTH_GITHUB_ID: z.string().min(1, "AUTH_GITHUB_ID is required"),
  AUTH_GITHUB_SECRET: z.string().min(1, "AUTH_GITHUB_SECRET is required"),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required"),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required"),
  AUTH_URL: z
    .string()
    .url("AUTH_URL must be a valid URL")
    .optional()
    .refine(
      (value) => !value || !isPlaceholder(value),
      "AUTH_URL must be a real URL, not a placeholder"
    ),
  OPENAI_API_KEY: z.string().optional().default(""),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
  RESEND_API_KEY: z.string(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url("NEXT_PUBLIC_POSTHOG_HOST must be a valid URL"),
  SENTRY_DSN: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional().or(z.literal("")),
  OPENAI_MODEL: z.string().optional(),
  STORAGE_PATH: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function loadRawEnv(): Record<string, string | undefined> {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_DATABASE_URL:
      process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_URL:
      process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
    NEXT_PUBLIC_POSTHOG_HOST:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    SENTRY_DSN: process.env.SENTRY_DSN ?? "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    STORAGE_PATH: process.env.STORAGE_PATH,
    NODE_ENV: process.env.NODE_ENV as Env["NODE_ENV"],
  };
}

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(loadRawEnv());
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function getDatabaseInfo(): DatabaseInfo {
  const env = getEnv();
  return parseDatabaseUrl(env.DATABASE_URL);
}

export function getMigrationDatabaseUrl(): string {
  const env = getEnv();
  return env.DIRECT_DATABASE_URL ?? env.DATABASE_URL;
}

export function isIntegrationConfigured(key: keyof Pick<
  Env,
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  | "RESEND_API_KEY"
  | "NEXT_PUBLIC_POSTHOG_KEY"
  | "SENTRY_DSN"
>): boolean {
  const env = getEnv();
  const value = env[key];
  return typeof value === "string" && value.length > 0 && !isPlaceholder(value);
}
