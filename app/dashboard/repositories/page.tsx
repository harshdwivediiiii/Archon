"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Plus, RefreshCw, BookOpen, ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";

export default function RepositoriesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Repositories</h1>
            <p className="text-zinc-400">Connect and manage your GitHub repositories</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Connect Repository
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitHubIcon className="h-5 w-5 text-purple-400" />
              Connected Repositories
            </CardTitle>
            <CardDescription>Repositories being analyzed by Archon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "archon-frontend", fullName: "org/archon-frontend", branch: "main", status: "synced", lastSync: "2 hours ago", language: "TypeScript" },
                { name: "archon-api", fullName: "org/archon-api", branch: "develop", status: "synced", lastSync: "5 hours ago", language: "Go" },
                { name: "infra-configs", fullName: "org/infra-configs", branch: "main", status: "syncing", lastSync: "Just now", language: "YAML" },
              ].map((repo) => (
                <div
                  key={repo.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-purple-600/10 p-2">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{repo.fullName}</p>
                        <Badge variant="outline" className="text-xs">{repo.language}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" /> {repo.branch}
                        </span>
                        <span>Last synced: {repo.lastSync}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={repo.status === "synced" ? "success" : "warning"} className="capitalize">
                      {repo.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
