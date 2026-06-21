"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart3,
  BookOpen,
  GitBranch,
  Layers,
  Network,
  Plus,
  Sparkles,
  ArrowRight,
  Server,
  Database,
  Globe,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";
import Link from "next/link";

export function DashboardClient() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">Welcome back to Archon</p>
          </div>
          <Link href="/dashboard/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Projects", value: "2", icon: Layers, color: "blue" },
            { label: "Repositories", value: "4", icon: GitBranch, color: "purple" },
            { label: "AI Queries", value: "128", icon: Sparkles, color: "emerald" },
            { label: "Team Members", value: "3", icon: Activity, color: "blue" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`rounded-lg bg-${stat.color}-600/10 p-3`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-400" />
                Recent Architecture
              </CardTitle>
              <CardDescription>Your recently viewed architecture diagrams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Microservices Architecture", status: "analyzed", date: "2 hours ago" },
                { name: "API Gateway Flow", status: "processing", date: "1 day ago" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-600/10 p-2">
                      <Server className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.date}</p>
                    </div>
                  </div>
                  <Badge
                    variant={item.status === "analyzed" ? "success" : "warning"}
                    className="capitalize"
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitHubIcon className="h-5 w-5 text-purple-400" />
                Connected Repositories
              </CardTitle>
              <CardDescription>Your GitHub repositories being analyzed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "archon-frontend", branch: "main", status: "synced" },
                { name: "archon-api", branch: "develop", status: "synced" },
                { name: "infra-configs", branch: "main", status: "syncing" },
              ].map((repo) => (
                <div
                  key={repo.name}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-600/10 p-2">
                      <BookOpen className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{repo.name}</p>
                      <p className="text-xs text-zinc-500">{repo.branch}</p>
                    </div>
                  </div>
                  <Badge
                    variant={repo.status === "synced" ? "success" : "warning"}
                    className="capitalize"
                  >
                    {repo.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              System Health Overview
            </CardTitle>
            <CardDescription>Architecture health metrics across your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Architecture Score", value: "92%", trend: "+5%", color: "text-emerald-400" },
                { label: "Dependency Health", value: "87%", trend: "+2%", color: "text-blue-400" },
                { label: "Documentation", value: "64%", trend: "+12%", color: "text-amber-400" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-400">{metric.label}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{metric.value}</span>
                    <span className={`text-sm ${metric.color}`}>{metric.trend}</span>
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
