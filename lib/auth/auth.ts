import NextAuth, { type Session } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

/**
 * Log auth environment status at startup.
 * Never throws — allows partial OAuth config (GitHub only, Google only, neither).
 */
function logAuthEnv(): void {
  const googleOk = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;
  const githubOk = !!process.env.AUTH_GITHUB_ID && !!process.env.AUTH_GITHUB_SECRET;
  const secretOk = !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32;

  if (!googleOk) {
    console.warn("[auth] Google OAuth not configured (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET)");
  }
  if (!githubOk) {
    console.warn("[auth] GitHub OAuth not configured (AUTH_GITHUB_ID / AUTH_GITHUB_SECRET)");
  }
  if (!secretOk) {
    console.warn("[auth] AUTH_SECRET missing or too short (must be >= 32 characters)");
  }

  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!url) {
    console.warn("[auth] AUTH_URL/NEXTAUTH_URL not set. Auth.js will auto-detect from VERCEL_URL.");
  }

  console.log("[auth] Environment:", process.env.NODE_ENV ?? "unknown");
  console.log("[auth] Platform:", process.env.VERCEL ? "vercel" : "self-hosted");
  console.log("[auth] AUTH_SECRET set:", !!process.env.AUTH_SECRET);
  console.log("[auth] Google configured:", googleOk);
  console.log("[auth] GitHub configured:", githubOk);
  console.log("[auth] DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("[auth] AUTH_URL:", process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "not set");
  console.log("[auth] VERCEL_URL:", process.env.VERCEL_URL ?? "not set");
}

logAuthEnv();

let handlers: {
  GET: (req: Request, ctx?: unknown) => Promise<Response>;
  POST: (req: Request, ctx?: unknown) => Promise<Response>;
} = {
  GET: async () => new Response("Auth loading", { status: 503 }),
  POST: async () => new Response("Auth loading", { status: 503 }),
};
let signIn: (...args: unknown[]) => Promise<void> = async () => {};
let signOut: (...args: unknown[]) => Promise<void> = async () => {};
let auth: () => Promise<Session | null> = async () => null;

try {
  const env = getEnv();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authResult: any = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    secret: env.AUTH_SECRET,
    session: { strategy: "database" },
    providers: authConfig.providers,
    callbacks: {
      ...authConfig.callbacks,
      async session({ session, user }) {
        if (session.user) {
          session.user.id = user.id;
        }
        return session;
      },
    },
    debug: process.env.NODE_ENV === "development",
  });

  handlers = authResult.handlers as typeof handlers;
  signIn = authResult.signIn as typeof signIn;
  signOut = authResult.signOut as typeof signOut;
  auth = authResult.auth as typeof auth;

  console.log("[auth] Auth.js initialized successfully");
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("[auth] Auth initialization failed:", msg);

  const degradedHandler = () =>
    Promise.resolve(
      NextResponse.json(
        {
          error: "Authentication is not configured",
          message: msg,
          hint: "Set the required environment variables in your Vercel project dashboard.",
        },
        { status: 500 }
      )
    );

  handlers = {
    GET: degradedHandler,
    POST: degradedHandler,
  };
  signIn = async () => {
    throw new Error("Auth not configured: " + msg);
  };
  signOut = async () => {
    throw new Error("Auth not configured: " + msg);
  };
  auth = async () => null;
}

export { handlers, signIn, signOut, auth };
