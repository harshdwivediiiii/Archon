import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { authConfig } from "./auth.config";

const env = getEnv();

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
