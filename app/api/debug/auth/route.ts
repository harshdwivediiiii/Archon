import { NextResponse } from "next/server";
import { auth, authConfig } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const envStatus = getEnvStatus();
  const providerStatus = getProviderStatus();
  const callbackUrls = getCallbackUrls();

  const configHealth = {
    trustHost: authConfig.trustHost ?? false,
    pages: authConfig.pages,
    sessionStrategy: "database",
    hasCustomCallbacks: {
      signIn: typeof authConfig.callbacks?.signIn === "function",
    },
  };

  const allOk =
    envStatus.authSecret &&
    envStatus.google.configured &&
    envStatus.github.configured &&
    envStatus.authUrlConfigured !== false;

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    platform: process.env.VERCEL ? "vercel" : "self-hosted",
    vercelUrl: process.env.VERCEL_URL ?? null,
    auth: {
      provider: "next-auth@5 (Auth.js)",
      configuredProviders: providerStatus,
      envValidation: envStatus,
      callbackUrls,
      configHealth,
    },
  });
}

function getEnvStatus() {
  const googleId = process.env.AUTH_GOOGLE_ID ?? "";
  const googleSecret = process.env.AUTH_GOOGLE_SECRET ?? "";
  const githubId = process.env.AUTH_GITHUB_ID ?? "";
  const githubSecret = process.env.AUTH_GITHUB_SECRET ?? "";
  const authSecret = process.env.AUTH_SECRET ?? "";
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? null;

  return {
    authSecret: authSecret.length >= 32,
    authSecretLength: authSecret.length,
    authUrlConfigured: authUrl !== null,
    authUrl: authUrl
      ? maskUrl(authUrl)
      : null,
    appUrl: appUrl
      ? maskUrl(appUrl)
      : null,
    google: {
      configured: googleId.length > 0 && googleSecret.length > 0,
      clientIdPrefix: googleId.length > 0
        ? `${googleId.slice(0, 12)}...`
        : "NOT SET",
    },
    github: {
      configured: githubId.length > 0 && githubSecret.length > 0,
      clientIdPrefix: githubId.length > 0
        ? `${githubId.slice(0, 12)}...`
        : "NOT SET",
    },
  };
}

function getProviderStatus() {
  const googleId = process.env.AUTH_GOOGLE_ID ?? "";
  const githubId = process.env.AUTH_GITHUB_ID ?? "";

  return {
    google: googleId.length > 0 ? "enabled" : "missing",
    github: githubId.length > 0 ? "enabled" : "missing",
  };
}

function getCallbackUrls() {
  const baseUrl = getBaseUrl();
  return {
    googleCallback: baseUrl ? `${baseUrl}/api/auth/callback/google` : "Could not determine",
    githubCallback: baseUrl ? `${baseUrl}/api/auth/callback/github` : "Could not determine",
    signIn: baseUrl ? `${baseUrl}/login` : "Could not determine",
    signOut: baseUrl ? `${baseUrl}/api/auth/signout` : "Could not determine",
  };
}

function getBaseUrl(): string | null {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (authUrl) return authUrl.replace(/\/+$/, "");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return null;
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    if (url.includes("://")) {
      const [protocol, rest] = url.split("://");
      return `${protocol}://${rest.slice(0, 20)}...`;
    }
    return `${url.slice(0, 20)}...`;
  }
}
