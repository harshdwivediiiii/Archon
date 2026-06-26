import NextAuth, { type Session } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

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

type AuthModule = {
  handlers: {
    GET: (req: any, ctx?: unknown) => Promise<Response>;
    POST: (req: any, ctx?: unknown) => Promise<Response>;
  };
  signIn: (...args: any[]) => Promise<void>;
  signOut: (...args: any[]) => Promise<void>;
  auth: () => Promise<Session | null>;
};

let _module: AuthModule | null = null;

function getAuth(): AuthModule {
  if (_module) return _module;

  logAuthEnv();

  try {
    const env = getEnv();

    const authResult: {
      handlers: AuthModule["handlers"];
      signIn: AuthModule["signIn"];
      signOut: AuthModule["signOut"];
      auth: AuthModule["auth"];
    } = NextAuth({
      ...authConfig,
      adapter: PrismaAdapter(getPrisma()),
      secret: env.AUTH_SECRET,
      session: { strategy: "database" },
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

    _module = {
      handlers: authResult.handlers,
      signIn: authResult.signIn,
      signOut: authResult.signOut,
      auth: authResult.auth,
    };
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

    _module = {
      handlers: { GET: degradedHandler, POST: degradedHandler },
      signIn: async () => {
        throw new Error("Auth not configured: " + msg);
      },
      signOut: async () => {
        throw new Error("Auth not configured: " + msg);
      },
      auth: async () => null,
    };
  }

  return _module;
}

export const handlers = {
  GET: (req: Request, ctx?: unknown) => getAuth().handlers.GET(req, ctx),
  POST: (req: Request, ctx?: unknown) => getAuth().handlers.POST(req, ctx),
};

export const signIn = (...args: unknown[]) => getAuth().signIn(...args);
export const signOut = (...args: unknown[]) => getAuth().signOut(...args);
export const auth = () => getAuth().auth();
