"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, ArrowRight, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkspace = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName || "My Workspace" }),
      });
      if (res.ok) {
        router.push("/dashboard");
        return;
      }
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Failed to create workspace");
    } catch {
      setError("Failed to create workspace. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="hero-gradient pointer-events-none fixed inset-0" />
      <Card className="relative w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          {step === 1 && (
            <>
              <CardTitle className="text-2xl">Welcome to Archon</CardTitle>
              <CardDescription>Let&apos;s get your workspace set up</CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-blue-400" />
                You&apos;re all set!
              </CardTitle>
              <CardDescription>Start exploring your architecture</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace Name</Label>
                <Input
                  id="workspace"
                  placeholder="My Workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-center text-sm text-zinc-400">
                Your workspace is ready. Start by connecting a GitHub repository or exploring the dashboard.
              </p>
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleCreateWorkspace} disabled={loading}>
                  {loading ? "Creating..." : "Go to Dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
