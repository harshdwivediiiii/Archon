"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  BarChart3,
  Code2,
  GitCommit,
  Users,
  FolderTree,
  Activity,
  AlertTriangle,
  Package,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  FileCode,
  GitBranch,
  RefreshCw,
} from "lucide-react";

type TimeRange = "7d" | "30d" | "90d" | "1y";

interface LanguageDist {
  language: string;
  percentage: number;
  files: number;
  lines: number;
  color: string;
}

interface LinesOfCode {
  total: number;
  byLanguage: Record<string, number>;
  averages: { perFile: number };
}

interface CommitData {
  date: string;
  count: number;
}

interface ContributorData {
  author: string;
  commitCount: number;
  linesChanged: number;
  lastActive: string;
  firstActive: string;
}

interface CodeOwnershipData {
  directory: string;
  primaryOwner: string;
  ownership: number;
  contributors: number;
}

interface ChurnData {
  rate: number;
  added: number;
  removed: number;
  netChange: number;
}

interface DebtData {
  score: number;
  level: string;
  hotspots: Array<{ file: string; score: number; reason: string }>;
}

interface DepData {
  name: string;
  current: string;
  latest: string;
  behind: number;
  status: "current" | "minor" | "major" | "unknown";
}

interface AnalyticsResponse {
  repositoryId: string;
  repositoryName: string;
  languageDistribution: LanguageDist[];
  linesOfCode: LinesOfCode;
}

interface RepoSummary {
  id: string;
  fullName: string;
  name: string;
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "1 year", value: "1y" },
];

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572a5",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#701516",
  PHP: "#4f5d95",
  "C++": "#f34b7d",
  "C#": "#178600",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

const TECH_DEBT_COLORS: Record<string, string> = {
  low: "text-emerald-400",
  moderate: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const DEP_STATUS_STYLES: Record<string, string> = {
  current: "bg-emerald-600/10 text-emerald-400 border-emerald-600/20",
  minor: "bg-amber-600/10 text-amber-400 border-amber-600/20",
  major: "bg-red-600/10 text-red-400 border-red-600/20",
  unknown: "bg-zinc-600/10 text-zinc-400 border-zinc-600/20",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function generateMockCommitFrequency(range: TimeRange): CommitData[] {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const data: CommitData[] = [];
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    data.push({
      date: date.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 15) + 1,
    });
  }
  return data;
}

function generateMockContributors(): ContributorData[] {
  return [
    { author: "alice", commitCount: 245, linesChanged: 12400, lastActive: new Date(Date.now() - 86400000).toISOString(), firstActive: new Date(Date.now() - 31536000000).toISOString() },
    { author: "bob", commitCount: 189, linesChanged: 8900, lastActive: new Date(Date.now() - 172800000).toISOString(), firstActive: new Date(Date.now() - 29030400000).toISOString() },
    { author: "charlie", commitCount: 134, linesChanged: 5600, lastActive: new Date(Date.now() - 259200000).toISOString(), firstActive: new Date(Date.now() - 24883200000).toISOString() },
    { author: "diana", commitCount: 98, linesChanged: 4200, lastActive: new Date(Date.now() - 432000000).toISOString(), firstActive: new Date(Date.now() - 18921600000).toISOString() },
    { author: "eve", commitCount: 67, linesChanged: 3100, lastActive: new Date(Date.now() - 604800000).toISOString(), firstActive: new Date(Date.now() - 12614400000).toISOString() },
  ];
}

function generateMockOwnership(): CodeOwnershipData[] {
  return [
    { directory: "/src/core", primaryOwner: "alice", ownership: 0.72, contributors: 3 },
    { directory: "/src/api", primaryOwner: "bob", ownership: 0.65, contributors: 4 },
    { directory: "/src/frontend", primaryOwner: "charlie", ownership: 0.58, contributors: 5 },
    { directory: "/src/database", primaryOwner: "diana", ownership: 0.81, contributors: 2 },
    { directory: "/src/utils", primaryOwner: "alice", ownership: 0.45, contributors: 6 },
    { directory: "/src/tests", primaryOwner: "eve", ownership: 0.63, contributors: 4 },
    { directory: "/config", primaryOwner: "bob", ownership: 0.55, contributors: 3 },
    { directory: "/docs", primaryOwner: "diana", ownership: 0.7, contributors: 2 },
  ];
}

function generateMockChurn(range: TimeRange): ChurnData {
  const base = range === "7d" ? 5000 : range === "30d" ? 20000 : range === "90d" ? 60000 : 250000;
  return {
    rate: 0.58,
    added: Math.round(base * 0.58),
    removed: Math.round(base * 0.42),
    netChange: Math.round(base * 0.16),
  };
}

function generateMockDebt(): DebtData {
  return {
    score: 12.4,
    level: "moderate",
    hotspots: [
      { file: "src/core/processor.ts", score: 28.5, reason: "High complexity: 45 (threshold: 10)" },
      { file: "src/api/handler.ts", score: 22.1, reason: "High complexity: 38 (threshold: 10); Code issues: 12 (threshold: 10)" },
      { file: "src/database/query.ts", score: 18.3, reason: "High complexity: 25 (threshold: 10); High duplication: 8 blocks (threshold: 5)" },
      { file: "src/frontend/components/DataTable.tsx", score: 15.7, reason: "Code issues: 15 (threshold: 10)" },
      { file: "src/utils/parser.ts", score: 12.9, reason: "High complexity: 20 (threshold: 10)" },
    ],
  };
}

function generateMockDeps(): DepData[] {
  return [
    { name: "next", current: "14.2.0", latest: "14.2.4", behind: 1, status: "minor" },
    { name: "react", current: "18.3.0", latest: "18.3.1", behind: 1, status: "minor" },
    { name: "typescript", current: "5.4.0", latest: "5.5.2", behind: 2, status: "minor" },
    { name: "tailwindcss", current: "3.4.0", latest: "3.4.4", behind: 1, status: "minor" },
    { name: "@prisma/client", current: "5.12.0", latest: "5.15.0", behind: 3, status: "minor" },
    { name: "framer-motion", current: "11.0.0", latest: "11.2.10", behind: 2, status: "minor" },
    { name: "lucide-react", current: "0.378.0", latest: "0.395.0", behind: 17, status: "minor" },
    { name: "next-auth", current: "5.0.0-beta.19", latest: "5.0.0-beta.21", behind: 1, status: "minor" },
    { name: "date-fns", current: "3.6.0", latest: "3.6.0", behind: 0, status: "current" },
    { name: "clsx", current: "2.1.0", latest: "2.1.1", behind: 1, status: "minor" },
    { name: "sharp", current: "0.33.3", latest: "0.33.4", behind: 1, status: "minor" },
    { name: "openai", current: "4.47.0", latest: "4.52.0", behind: 5, status: "minor" },
  ];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsClient() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const mockCommitFreq = generateMockCommitFrequency(timeRange);
  const mockContributors = generateMockContributors();
  const mockOwnership = generateMockOwnership();
  const mockChurn = generateMockChurn(timeRange);
  const mockDebt = generateMockDebt();
  const mockDeps = generateMockDeps();

  const fetchRepos = useCallback(async () => {
    try {
      const res = await fetch("/api/repositories");
      if (res.ok) {
        const data: RepoSummary[] = await res.json();
        setRepos(data);
        if (data.length > 0 && !selectedRepoId) {
          setSelectedRepoId(data[0].id);
        }
      }
    } catch {
      // ignore
    }
  }, [selectedRepoId]);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedRepoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?repositoryId=${selectedRepoId}`);
      if (res.ok) {
        const data: AnalyticsResponse = await res.json();
        setAnalytics(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedRepoId]);

  useEffect(() => { fetchRepos(); }, [fetchRepos]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const maxCommitCount = Math.max(...mockCommitFreq.map((d) => d.count), 1);
  const churnPct = Math.round(mockChurn.rate * 100);
  const debtLevel = mockDebt.level;
  const debtColor = TECH_DEBT_COLORS[debtLevel] || "text-zinc-400";

  const selectedRepoName = repos.find((r) => r.id === selectedRepoId)?.fullName || "Select a repository";

  return (
    <DashboardLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-zinc-400">Repository metrics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="rounded-lg border border-[#414754] bg-[#1c1f27] px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0070f3]"
            >
              {repos.length === 0 && <option value="">No repositories</option>}
              {repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.fullName}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-[#414754] overflow-hidden">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setTimeRange(r.value)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition-colors",
                    timeRange === r.value
                      ? "bg-[#0070f3] text-white"
                      : "bg-[#1c1f27] text-zinc-400 hover:bg-[#272a32]"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <AnalyticsSkeleton />
        ) : (
          <motion.div variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Total Lines of Code</p>
                    <p className="text-2xl font-bold text-white">
                      {formatNumber(analytics?.linesOfCode.total ?? 0)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      ~{Math.round(analytics?.linesOfCode.averages.perFile ?? 0)} avg per file
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <Code2 className="h-5 w-5 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Languages</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics?.languageDistribution.length ?? 0}
                    </p>
                    <p className="text-xs text-zinc-500">detected in codebase</p>
                  </div>
                  <div className="rounded-lg bg-purple-600/10 p-3">
                    <Layers className="h-5 w-5 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Churn Rate</p>
                    <p className="text-2xl font-bold text-white">{churnPct}%</p>
                    <p className="text-xs text-zinc-500">
                      {mockChurn.netChange >= 0 ? "+" : ""}{formatNumber(mockChurn.netChange)} net lines
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-600/10 p-3">
                    <Activity className="h-5 w-5 text-amber-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-zinc-400">Tech Debt Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-white">{mockDebt.score}</p>
                      <Badge variant={debtLevel === "critical" ? "destructive" : debtLevel === "high" ? "warning" : debtLevel === "moderate" ? "default" : "success"}>
                        {debtLevel}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-600/10 p-3">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-2">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-400" />
                      Language Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown of languages by file count
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(!analytics?.languageDistribution || analytics.languageDistribution.length === 0) ? (
                        <p className="text-sm text-zinc-500 text-center py-8">No language data available</p>
                      ) : (
                        analytics.languageDistribution.map((lang) => (
                          <div key={lang.language}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-sm"
                                  style={{ backgroundColor: lang.color || LANGUAGE_COLORS[lang.language] || "#6b7280" }}
                                />
                                <span className="text-sm text-zinc-200">{lang.language}</span>
                              </div>
                              <span className="text-sm text-zinc-400">
                                {lang.percentage.toFixed(1)}% · {lang.files} files
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#272a32] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: lang.color || LANGUAGE_COLORS[lang.language] || "#6b7280" }}
                                initial={{ width: 0 }}
                                animate={{ width: `${lang.percentage}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-emerald-400" />
                      Lines of Code by Language
                    </CardTitle>
                    <CardDescription>
                      Total: {formatNumber(analytics?.linesOfCode.total ?? 0)} lines
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(!analytics?.linesOfCode.byLanguage || Object.keys(analytics.linesOfCode.byLanguage).length === 0) ? (
                        <p className="text-sm text-zinc-500 text-center py-8">No line data available</p>
                      ) : (
                        Object.entries(analytics.linesOfCode.byLanguage)
                          .sort(([, a], [, b]) => b - a)
                          .map(([language, lines]) => {
                            const total = analytics?.linesOfCode.total || 1;
                            const pct = (lines / total) * 100;
                            return (
                              <div key={language}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-zinc-200">{language}</span>
                                  <span className="text-sm text-zinc-400">{formatNumber(lines)} lines</span>
                                </div>
                                <div className="h-2 rounded-full bg-[#272a32] overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: LANGUAGE_COLORS[language] || "#6b7280" }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCommit className="h-5 w-5 text-indigo-400" />
                      Commit Frequency
                    </CardTitle>
                    <CardDescription>
                      Daily commits over the last {timeRange}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-0.5 h-40">
                      {mockCommitFreq.slice(-60).map((d, i) => {
                        const height = (d.count / maxCommitCount) * 100;
                        return (
                          <div
                            key={d.date}
                            className="flex-1 group relative"
                          >
                            <motion.div
                              className="w-full rounded-t-sm bg-indigo-500/70 hover:bg-indigo-400 transition-colors cursor-pointer"
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 0.4, delay: i * 0.005 }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                              <div className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-200 whitespace-nowrap shadow-lg">
                                {d.date}: {d.count} commits
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-cyan-400" />
                      Top Contributors
                    </CardTitle>
                    <CardDescription>
                      Most active contributors in the codebase
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mockContributors.map((c, i) => (
                        <div
                          key={c.author}
                          className="flex items-center justify-between rounded-lg border border-[#414754] px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                              i === 0 ? "bg-amber-600/20 text-amber-400" :
                              i === 1 ? "bg-zinc-600/20 text-zinc-300" :
                              i === 2 ? "bg-orange-600/20 text-orange-400" :
                              "bg-[#272a32] text-zinc-400"
                            )}>
                              {c.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{c.author}</p>
                              <p className="text-xs text-zinc-500">
                                {c.commitCount} commits · {formatNumber(c.linesChanged)} lines
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            #{i + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderTree className="h-5 w-5 text-rose-400" />
                      Code Ownership
                    </CardTitle>
                    <CardDescription>
                      Directory ownership breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mockOwnership.map((item) => (
                        <div key={item.directory} className="rounded-lg border border-[#414754] px-4 py-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white font-mono">
                              {item.directory}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {item.contributors} contributor{item.contributors !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[#272a32] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-rose-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.ownership * 100}%` }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 shrink-0">
                              {item.primaryOwner} · {Math.round(item.ownership * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-amber-400" />
                      Churn Rate
                    </CardTitle>
                    <CardDescription>
                      Lines added vs removed over {timeRange}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center gap-8 py-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-emerald-400 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-medium">Added</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {formatNumber(mockChurn.added)}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-red-400 mb-1">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-xs font-medium">Removed</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {formatNumber(mockChurn.removed)}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className={cn(
                          "flex items-center gap-1 mb-1",
                          mockChurn.netChange >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {mockChurn.netChange >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="text-xs font-medium">Net</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {mockChurn.netChange >= 0 ? "+" : ""}{formatNumber(mockChurn.netChange)}
                        </p>
                      </div>
                    </div>
                    <div className="h-4 rounded-full bg-[#272a32] overflow-hidden flex">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${churnPct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                      <motion.div
                        className="h-full bg-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - churnPct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{churnPct}% added</span>
                      <span>{100 - churnPct}% removed</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-5 w-5", debtColor)} />
                      Technical Debt Assessment
                    </CardTitle>
                    <CardDescription>
                      Code quality hotspots and improvement areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-20 w-20 items-center justify-center">
                        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#272a32" strokeWidth="8" />
                          <motion.circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke={debtLevel === "critical" ? "#ef4444" : debtLevel === "high" ? "#f97316" : debtLevel === "moderate" ? "#f59e0b" : "#22c55e"}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 42}
                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - Math.min(mockDebt.score / 50, 1)) }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </svg>
                        <span className="text-lg font-bold text-white">{mockDebt.score}</span>
                      </div>
                      <div>
                        <Badge variant={debtLevel === "critical" ? "destructive" : debtLevel === "high" ? "warning" : debtLevel === "moderate" ? "default" : "success"}>
                          {debtLevel}
                        </Badge>
                        <p className="text-xs text-zinc-400 mt-2">
                          Score range: 0 (clean) - 50 (critical)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Hotspots</p>
                      {mockDebt.hotspots.slice(0, 4).map((h) => (
                        <div key={h.file} className="rounded-lg border border-[#414754] px-3 py-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-mono text-zinc-200 truncate">{h.file}</span>
                            <span className="text-xs text-red-400 font-medium">{h.score}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">{h.reason}</p>
                        </div>
                      ))}
                      {mockDebt.hotspots.length > 4 && (
                        <p className="text-xs text-zinc-500 text-center pt-1">
                          +{mockDebt.hotspots.length - 4} more hotspots
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-400" />
                      Dependency Freshness
                    </CardTitle>
                    <CardDescription>
                      Package versions and update status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#414754] text-left text-zinc-400">
                            <th className="pb-2 pr-3 font-medium">Package</th>
                            <th className="pb-2 pr-3 font-medium">Current</th>
                            <th className="pb-2 pr-3 font-medium">Latest</th>
                            <th className="pb-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockDeps.map((dep) => (
                            <tr key={dep.name} className="border-b border-[#414754]/50 transition-colors hover:bg-[#272a32]/30">
                              <td className="py-2.5 pr-3">
                                <span className="text-zinc-200 font-mono text-xs">{dep.name}</span>
                              </td>
                              <td className="py-2.5 pr-3 text-zinc-400 font-mono text-xs">{dep.current}</td>
                              <td className="py-2.5 pr-3 text-zinc-400 font-mono text-xs">{dep.latest}</td>
                              <td className="py-2.5">
                                <span className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  DEP_STATUS_STYLES[dep.status]
                                )}>
                                  {dep.status === "current" ? <Minus className="h-3 w-3 mr-0.5" /> :
                                   dep.status === "major" ? <TrendingUp className="h-3 w-3 mr-0.5" /> :
                                   dep.status === "minor" ? <Clock className="h-3 w-3 mr-0.5" /> : null}
                                  {dep.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
