"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import {
  BookOpen,
  GitBranch,
  Layers,
  Network,
  Plus,
  Server,
  AlertTriangle,
  Database,
  FileCode,
  Shield,
  Heart,
  BrainCircuit,
  Zap,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Code2,
} from "lucide-react";
import { GitHubIcon } from "@/components/ui/github-icon";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  repoCount: number;
  diagramCount: number;
  updatedAt: string;
}

interface RepoSummary {
  id: string;
  fullName: string;
  defaultBranch: string;
  lastSyncedAt: string | null;
}

interface DashboardStats {
  projects: number;
  repos: number;
  diagrams: number;
  services: number;
  apis: number;
  databases: number;
  technologies: string[];
  securityFindings: number;
}

interface ScoreCardProps {
  label: string;
  value: number;
  maxValue: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  trailColor: string;
  delay?: number;
}

function AnimatedScoreCard({ label, value, maxValue, icon: Icon, color, trailColor, delay = 0 }: ScoreCardProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex h-[100px] w-[100px] items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={trailColor}
                  strokeWidth="6"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: delay + 0.3 }}
                />
              </svg>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: delay + 0.6 }}
              >
                <Icon className="h-7 w-7" style={{ color }} />
              </motion.div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-zinc-400">{label}</span>
              <motion.span
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: delay + 0.8 }}
              >
                {value}
                <span className="text-lg font-normal text-zinc-500">/{maxValue}</span>
              </motion.span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <Skeleton className="h-[100px] w-[100px] rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const quickActions = [
  { label: "New Chat", href: "/dashboard/chat", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-600/10" },
  { label: "Code Review", href: "/dashboard/code-review", icon: Code2, color: "text-emerald-400", bg: "bg-emerald-600/10" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, color: "text-purple-400", bg: "bg-purple-600/10" },
  { label: "View Security", href: "/dashboard/security", icon: Shield, color: "text-rose-400", bg: "bg-rose-600/10" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0, repos: 0, diagrams: 0,
    services: 0, apis: 0, databases: 0,
    technologies: [], securityFindings: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [projRes, repoRes, statsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/repositories"),
          fetch("/api/dashboard/stats"),
        ]);
        if (cancelled) return;

        if (projRes.ok) {
          const data: Project[] = await projRes.json();
          setProjects(data);
          const repoData = repoRes.ok ? await repoRes.json() : [];
          setRepos(repoData);
        }
        if (statsRes.ok) {
          const data: DashboardStats = await statsRes.json();
          setStats(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const healthScore = Math.min(
    100 - (stats.securityFindings > 0 ? stats.securityFindings * 5 : 0),
    100
  );
  const securityScore = Math.min(
    100 - (stats.securityFindings > 0 ? stats.securityFindings * 8 : 0),
    100
  );
  const aiScore = Math.min(
    stats.projects * 10 + stats.repos * 5 + stats.services * 3,
    100
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
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
        </motion.div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatedScoreCard
                label="Health Score"
                value={healthScore}
                maxValue={100}
                icon={Heart}
                color="#22c55e"
                trailColor="rgba(34,197,94,0.15)"
                delay={0}
              />
              <AnimatedScoreCard
                label="Security Score"
                value={securityScore}
                maxValue={100}
                icon={Shield}
                color="#3b82f6"
                trailColor="rgba(59,130,246,0.15)"
                delay={0.1}
              />
              <AnimatedScoreCard
                label="AI Score"
                value={aiScore}
                maxValue={100}
                icon={BrainCircuit}
                color="#a855f7"
                trailColor="rgba(168,85,247,0.15)"
                delay={0.2}
              />
            </div>

            <motion.div variants={itemVariants}>
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-zinc-300">Quick Actions</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-zinc-700/50 bg-zinc-900/50 px-4 py-2 hover:bg-zinc-800"
                    >
                      <div className={cn("rounded-md p-1.5", action.bg)}>
                        <action.icon className={cn("h-4 w-4", action.color)} />
                      </div>
                      <span className="text-sm text-zinc-200">{action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                    </Button>
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Projects</p>
                    <p className="text-2xl font-bold text-white">{stats.projects}</p>
                  </div>
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <Layers className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Repositories</p>
                    <p className="text-2xl font-bold text-white">{stats.repos}</p>
                  </div>
                  <div className="rounded-lg bg-purple-600/10 p-3">
                    <GitBranch className="h-5 w-5 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Services</p>
                    <p className="text-2xl font-bold text-white">{stats.services}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-600/10 p-3">
                    <Server className="h-5 w-5 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">APIs</p>
                    <p className="text-2xl font-bold text-white">{stats.apis}</p>
                  </div>
                  <div className="rounded-lg bg-cyan-600/10 p-3">
                    <Network className="h-5 w-5 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Databases</p>
                    <p className="text-2xl font-bold text-white">{stats.databases}</p>
                  </div>
                  <div className="rounded-lg bg-amber-600/10 p-3">
                    <Database className="h-5 w-5 text-amber-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Diagrams</p>
                    <p className="text-2xl font-bold text-white">{stats.diagrams}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-600/10 p-3">
                    <Network className="h-5 w-5 text-indigo-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Technologies</p>
                    <p className="text-2xl font-bold text-white">{stats.technologies.length}</p>
                  </div>
                  <div className="rounded-lg bg-pink-600/10 p-3">
                    <FileCode className="h-5 w-5 text-pink-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Security Issues</p>
                    <p className="text-2xl font-bold text-white">{stats.securityFindings}</p>
                  </div>
                  <div className="rounded-lg bg-red-600/10 p-3">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {stats.technologies.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-pink-400" />
                      Detected Technologies
                    </CardTitle>
                    <CardDescription>Technologies identified across your repositories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stats.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-400" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>Your recently updated projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-zinc-500">No projects yet</p>
                      <Link href="/dashboard/projects">
                        <Button variant="link" className="mt-2">
                          Create your first project
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <Link key={project.id} href="/dashboard/architecture">
                        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-600/10 p-2">
                              <Server className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{project.name}</p>
                              <p className="text-xs text-zinc-500">
                                {project.repoCount} repos · {project.diagramCount} diagrams
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  )}
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
                  {repos.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-zinc-500">No repositories connected</p>
                      <Link href="/dashboard/repositories">
                        <Button variant="link" className="mt-2">
                          Connect a repository
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    repos.slice(0, 5).map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-purple-600/10 p-2">
                            <BookOpen className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{repo.fullName}</p>
                            <p className="text-xs text-zinc-500">{repo.defaultBranch}</p>
                          </div>
                        </div>
                        <Badge variant={repo.lastSyncedAt ? "success" : "warning"} className="capitalize">
                          {repo.lastSyncedAt ? "synced" : "pending"}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
