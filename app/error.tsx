"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-red-400">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Check `/dev/health` for service diagnostics.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/dev/health">Open health dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
