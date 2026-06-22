import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { authConfig } from "./auth.config";

const env = getEnv();

/**
 * Startup validation: fail fast with clear errors if OAuth credentials are missing.
 */
function validateAuthEnv(): void {
  const missing: string[] = [];

  if (!process.env.AUTH_GOOGLE_ID) {
    missing.push("AUTH_GOOGLE_ID (Google OAuth Client ID)");
  }
  if (!process.env.AUTH_GOOGLE_SECRET) {
    missing.push("AUTH_GOOGLE_SECRET (Google OAuth Client Secret)");
  }
  if (!process.env.AUTH_GITHUB_ID) {
    missing.push("AUTH_GITHUB_ID (GitHub OAuth Client ID)");
  }
  if (!process.env.AUTH_GITHUB_SECRET) {
    missing.push("AUTH_GITHUB_SECRET (GitHub OAuth Client Secret)");
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    missing.push("AUTH_SECRET (must be at least 32 characters)");
  }

  if (missing.length > 0) {
    throw new Error(
      `Auth.js startup validation failed - missing or invalid environment variables:\n  - ${missing.join("\n  - ")}\n\n` +
        "Set these in your .env file or Vercel project environment variables."
    );
  }

  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!url) {
    console.warn(
      "[auth] Warning: AUTH_URL/NEXTAUTH_URL is not set. " +
        "Auth.js will auto-detect the URL from VERCEL_URL or request headers. " +
        "Set AUTH_URL explicitly for production to avoid callback URL issues."
    );
  }
}

// Run validation at module load time (server boot)
validateAuthEnv();

/**
 * Full Auth.js instance for Node.js runtimes (API routes, server components).
 * Extends the edge-safe authConfig with Prisma adapter and database sessions.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: env.AUTH_SECRET,
  session: {
    strategy: "database",
  },
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
