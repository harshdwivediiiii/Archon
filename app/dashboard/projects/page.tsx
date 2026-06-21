"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, GitBranch, Network, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-zinc-400">Manage your architecture projects</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Frontend Platform", repos: 3, diagrams: 5, status: "active", updated: "2h ago" },
            { name: "API Gateway", repos: 2, diagrams: 3, status: "active", updated: "1d ago" },
          ].map((project) => (
            <Link key={project.name} href="/dashboard/architecture">
              <Card className="group cursor-pointer transition-all hover:border-blue-600/50">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-lg bg-blue-600/10 p-2">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                    </div>
                    <Badge variant="success" className="capitalize">{project.status}</Badge>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400">
                    {project.name}
                  </h3>
                  <div className="mb-4 flex gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3.5 w-3.5" /> {project.repos} repos
                    </span>
                    <span className="flex items-center gap-1">
                      <Network className="h-3.5 w-3.5" /> {project.diagrams} diagrams
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Updated {project.updated}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
