"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, GitBranch, Network, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string | null;
  repoCount: number;
  diagramCount: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/projects");
        if (!cancelled) {
          if (res.ok) {
            setProjects(await res.json());
          } else {
            setError("Failed to load projects");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });
      if (res.ok) {
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        setCreateOpen(false);
        setNewName("");
        setNewDescription("");
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-zinc-400">Manage your architecture projects</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <BookOpen className="mb-4 h-12 w-12 text-zinc-600" />
              <h3 className="mb-2 text-lg font-semibold text-white">No projects yet</h3>
              <p className="mb-6 text-sm text-zinc-400">Create your first project to get started</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href="/dashboard/architecture">
                <Card className="group cursor-pointer transition-all hover:border-blue-600/50">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-lg bg-blue-600/10 p-2">
                        <BookOpen className="h-5 w-5 text-blue-400" />
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {project.repoCount > 0 ? "active" : "new"}
                      </Badge>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mb-4 text-sm text-zinc-500 line-clamp-2">{project.description}</p>
                    )}
                    <div className="mb-4 flex gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3.5 w-3.5" /> {project.repoCount} repos
                      </span>
                      <span className="flex items-center gap-1">
                        <Network className="h-3.5 w-3.5" /> {project.diagramCount} diagrams
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a new architecture project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Project"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your project"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
