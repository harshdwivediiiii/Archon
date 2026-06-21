"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu } from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";
import Link from "next/link";

const AUTH_ERRORS: Record<string, string> = {
  Configuration: "Server configuration error. Check environment variables and database connectivity.",
  AccessDenied: "Access denied. You may not have permission to sign in.",
  Verification: "Verification link expired or already used.",
  OAuthSignin: "Could not start OAuth sign-in. Check provider credentials.",
  OAuthCallback: "OAuth callback failed. This is often caused by database connection issues.",
  OAuthCreateAccount: "Could not create user account. Check database schema and migrations.",
  CallbackRouteError: "Authentication callback failed. Check server logs for details.",
  Default: "An unexpected authentication error occurred.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="hero-gradient pointer-events-none fixed inset-0" />
      <Card className="relative w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Archon</CardTitle>
          <CardDescription>Sign in to start understanding your architecture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <p className="font-medium">Authentication failed</p>
              <p className="mt-1 text-red-200/80">{errorMessage}</p>
              {errorCode && (
                <p className="mt-2 text-xs text-red-300/60">Error code: {errorCode}</p>
              )}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full py-6"
            onClick={() => signIn("github", { redirectTo: "/dashboard" })}
          >
            <GitHubIcon className="mr-2 h-5 w-5" />
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            className="w-full py-6"
            onClick={() => signIn("google", { redirectTo: "/dashboard" })}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">Secure authentication</span>
            </div>
          </div>
          <p className="text-center text-xs text-zinc-600">
            By continuing, you agree to our{" "}
            <Link href="#" className="underline hover:text-zinc-400">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-zinc-400">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}
