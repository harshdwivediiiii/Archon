import { checkDatabaseConnection } from "@/lib/db/prisma";
import { testOpenAIConnection } from "@/lib/ai/openai";
import { testStripeConnection } from "@/lib/stripe/client";
import { getDatabaseInfo, getEnv, isIntegrationConfigured, parseDatabaseUrl } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage/provider";

export type HealthStatus = "connected" | "warning" | "failed";

export type HealthCheck = {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, string | boolean | number>;
};

export type HealthReport = {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  checks: HealthCheck[];
};

function overallStatus(checks: HealthCheck[]): HealthStatus {
  if (checks.some((check) => check.status === "failed")) return "failed";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "connected";
}

async function checkEnvironment(): Promise<HealthCheck> {
  try {
    const env = getEnv();
    const db = getDatabaseInfo();
    const directUrl =
      env.DIRECT_DATABASE_URL ?? process.env.DATABASE_DIRECT_URL ?? env.DATABASE_URL;
    const directInfo = directUrl ? parseDatabaseUrl(directUrl) : null;
    return {
      name: "Environment",
      status: "connected",
      message: "Required environment variables validated",
      details: {
        appUrl: env.NEXT_PUBLIC_APP_URL || "not set",
        databaseHost: db.hostname,
        databaseName: db.database,
        usesPooler: db.usesPooler,
        migrationHost: directInfo?.hostname ?? "not set",
        migrationPort: directInfo?.port ?? "not set",
      },
    };
  } catch (error) {
    return {
      name: "Environment",
      status: "failed",
      message: error instanceof Error ? error.message : "Environment validation failed",
    };
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const result = await checkDatabaseConnection();
  const db = (() => {
    try {
      return getDatabaseInfo();
    } catch {
      return null;
    }
  })();

  return {
    name: "Database",
    status: result.ok ? "connected" : "failed",
    latencyMs: result.latencyMs,
    message: result.ok ? "PostgreSQL connection successful" : result.error,
    details: db
      ? {
          host: db.hostname,
          port: db.port,
          database: db.database,
          username: db.username,
          pooler: db.usesPooler,
        }
      : undefined,
  };
}

async function checkPrisma(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.user.count();
    return {
      name: "Prisma",
      status: "connected",
      latencyMs: Date.now() - start,
      message: "Prisma client operational",
    };
  } catch (error) {
    return {
      name: "Prisma",
      status: "failed",
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : "Prisma check failed",
    };
  }
}

async function checkAuthJs(): Promise<HealthCheck> {
  try {
    const env = getEnv();
    const hasGithub = Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET);
    const hasGoogle = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
    const hasSecret = env.AUTH_SECRET.length >= 32;

    if (!hasSecret || !hasGithub || !hasGoogle) {
      return {
        name: "Auth.js",
        status: "failed",
        message: "Auth.js configuration incomplete",
        details: {
          secretConfigured: hasSecret,
          githubConfigured: hasGithub,
          googleConfigured: hasGoogle,
        },
      };
    }

    return {
      name: "Auth.js",
      status: "connected",
      message: "Auth.js configured with database sessions",
      details: {
        sessionStrategy: "database",
        githubProvider: hasGithub,
        googleProvider: hasGoogle,
      },
    };
  } catch (error) {
    return {
      name: "Auth.js",
      status: "failed",
      message: error instanceof Error ? error.message : "Auth.js check failed",
    };
  }
}

async function checkOAuthProvider(name: string, clientIdKey: "AUTH_GITHUB_ID" | "AUTH_GOOGLE_ID"): Promise<HealthCheck> {
  try {
    const env = getEnv();
    const clientId = env[clientIdKey];
    const configured = Boolean(clientId && clientId.length > 0);

    return {
      name,
      status: configured ? "connected" : "failed",
      message: configured ? `${name} OAuth credentials present` : `${name} OAuth credentials missing`,
      details: {
        clientIdPrefix: configured ? `${clientId.slice(0, 6)}…` : "not set",
      },
    };
  } catch (error) {
    return {
      name,
      status: "failed",
      message: error instanceof Error ? error.message : `${name} check failed`,
    };
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  try {
    getEnv();
    const result = await testOpenAIConnection();
    return {
      name: "OpenAI",
      status: result.ok ? "connected" : "failed",
      latencyMs: result.latencyMs,
      message: result.ok ? "OpenAI API reachable with streaming" : result.error,
      details: {
        model: result.model ?? "unknown",
        streaming: result.streaming ?? false,
      },
    };
  } catch (error) {
    return {
      name: "OpenAI",
      status: "failed",
      message: error instanceof Error ? error.message : "OpenAI check failed",
    };
  }
}

async function checkStripe(): Promise<HealthCheck> {
  try {
    const result = await testStripeConnection();
    return {
      name: "Stripe",
      status: result.status,
      latencyMs: result.latencyMs,
      message: result.error ?? (result.ok ? "Stripe API reachable" : "Stripe not configured"),
      details: {
        hasSecretKey: result.hasSecretKey,
        hasPublishableKey: result.hasPublishableKey,
        hasWebhookSecret: result.hasWebhookSecret,
        accountId: result.accountId ? `${result.accountId.slice(0, 8)}…` : "n/a",
      },
    };
  } catch (error) {
    return {
      name: "Stripe",
      status: "failed",
      message: error instanceof Error ? error.message : "Stripe check failed",
    };
  }
}

async function checkResend(): Promise<HealthCheck> {
  if (!isIntegrationConfigured("RESEND_API_KEY")) {
    return {
      name: "Resend",
      status: "warning",
      message: "RESEND_API_KEY is not configured",
    };
  }

  const start = Date.now();
  try {
    const env = getEnv();
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      return {
        name: "Resend",
        status: "connected",
        latencyMs: Date.now() - start,
        message: "Resend API key valid",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        name: "Resend",
        status: "failed",
        latencyMs: Date.now() - start,
        message: "Resend API key rejected",
      };
    }

    return {
      name: "Resend",
      status: "warning",
      latencyMs: Date.now() - start,
      message: `Resend API returned status ${response.status}`,
    };
  } catch (error) {
    return {
      name: "Resend",
      status: "failed",
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : "Resend check failed",
    };
  }
}

async function checkPostHog(): Promise<HealthCheck> {
  if (!isIntegrationConfigured("NEXT_PUBLIC_POSTHOG_KEY")) {
    return {
      name: "PostHog",
      status: "warning",
      message: "NEXT_PUBLIC_POSTHOG_KEY is not configured",
    };
  }

  try {
    const env = getEnv();
    const host = new URL(env.NEXT_PUBLIC_POSTHOG_HOST);
    return {
      name: "PostHog",
      status: "connected",
      message: "PostHog configuration present",
      details: {
        host: host.hostname,
        keyConfigured: true,
      },
    };
  } catch (error) {
    return {
      name: "PostHog",
      status: "failed",
      message: error instanceof Error ? error.message : "PostHog check failed",
    };
  }
}

async function checkSentry(): Promise<HealthCheck> {
  if (!isIntegrationConfigured("SENTRY_DSN")) {
    return {
      name: "Sentry",
      status: "warning",
      message: "SENTRY_DSN is not configured",
    };
  }

  try {
    const env = getEnv();
    const dsn = new URL(env.SENTRY_DSN);
    return {
      name: "Sentry",
      status: "connected",
      message: "Sentry DSN configured",
      details: {
        host: dsn.hostname,
        projectConfigured: Boolean(dsn.pathname && dsn.pathname !== "/"),
      },
    };
  } catch {
    return {
      name: "Sentry",
      status: "failed",
      message: "SENTRY_DSN is not a valid URL",
    };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const storage = await getStorageProvider();
    const testKey = `.healthcheck-${Date.now()}`;
    await storage.put(testKey, Buffer.from("ok"), "text/plain");
    const exists = await storage.exists(testKey);
    await storage.delete(testKey);

    return {
      name: "Storage",
      status: exists ? "connected" : "failed",
      latencyMs: Date.now() - start,
      message: "Local filesystem storage operational",
      details: {
        provider: "local",
      },
    };
  } catch (error) {
    return {
      name: "Storage",
      status: "failed",
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : "Storage check failed",
    };
  }
}

export async function runHealthChecks(options?: {
  skipExternal?: boolean;
}): Promise<HealthReport> {
  const checks: HealthCheck[] = [
    await checkEnvironment(),
    await checkDatabase(),
    await checkPrisma(),
    await checkAuthJs(),
    await checkOAuthProvider("GitHub OAuth", "AUTH_GITHUB_ID"),
    await checkOAuthProvider("Google OAuth", "AUTH_GOOGLE_ID"),
    await checkStorage(),
  ];

  if (!options?.skipExternal) {
    checks.push(
      await checkOpenAI(),
      await checkStripe(),
      await checkResend(),
      await checkPostHog(),
      await checkSentry()
    );
  }

  return {
    status: overallStatus(checks),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    checks,
  };
}
