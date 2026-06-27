"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code2,
  GitPullRequest,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Bug,
  Shield,
  Zap,
  BookOpen,
  Type,
  Sigma,
  Lightbulb,
  Copy,
  X,
} from "lucide-react";

type ReviewSeverity = "critical" | "high" | "medium" | "low" | "info";
type ReviewCategory =
  | "bug" | "security" | "performance" | "readability"
  | "naming" | "complexity" | "suggestion" | "code_smell" | "duplication";

interface ReviewFinding {
  id: string;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  suggestion: string;
  code: string;
}

interface ReviewSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  categories: Record<ReviewCategory, number>;
}

interface ReviewResult {
  findings: ReviewFinding[];
  summary: ReviewSummary;
}

interface PRFile {
  filename: string;
  content: string;
}

const LANGUAGES = [
  "typescript", "javascript", "python", "go", "rust", "java",
  "ruby", "php", "csharp", "cpp", "c", "swift", "kotlin",
  "scala", "shell", "yaml", "html", "css",
];

const SEVERITY_STYLES: Record<ReviewSeverity, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-red-600/10", text: "text-red-400", border: "border-red-600/20", label: "Critical" },
  high: { bg: "bg-orange-600/10", text: "text-orange-400", border: "border-orange-600/20", label: "High" },
  medium: { bg: "bg-yellow-600/10", text: "text-yellow-400", border: "border-yellow-600/20", label: "Medium" },
  low: { bg: "bg-blue-600/10", text: "text-blue-400", border: "border-blue-600/20", label: "Low" },
  info: { bg: "bg-gray-600/10", text: "text-gray-400", border: "border-gray-600/20", label: "Info" },
};

const CATEGORY_ICONS: Record<ReviewCategory, React.ComponentType<{ className?: string }>> = {
  bug: Bug,
  security: Shield,
  performance: Zap,
  readability: BookOpen,
  naming: Type,
  complexity: Sigma,
  suggestion: Lightbulb,
  code_smell: Copy,
  duplication: Copy,
};

function severityBadge(severity: ReviewSeverity) {
  const s = SEVERITY_STYLES[severity];
  return (
    <Badge className={`${s.bg} ${s.text} ${s.border} border`}>
      {s.label}
    </Badge>
  );
}

function categoryIcon(category: ReviewCategory) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className="h-3.5 w-3.5" />;
}

function FindingCard({ finding }: { finding: ReviewFinding }) {
  const s = SEVERITY_STYLES[finding.severity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${s.border} ${s.bg} p-4 space-y-2`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {severityBadge(finding.severity)}
          <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">
            L{finding.lineStart}{finding.lineEnd !== finding.lineStart ? `-L${finding.lineEnd}` : ""}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            {categoryIcon(finding.category)}
            {finding.category}
          </span>
        </div>
        <span className="text-xs text-zinc-600 font-mono truncate max-w-[200px]" title={finding.file}>
          {finding.file}
        </span>
      </div>
      <p className="text-sm text-zinc-200">{finding.message}</p>
      {finding.code && (
        <pre className="text-xs text-zinc-400 font-mono bg-black/40 rounded p-2 overflow-x-auto">
          <code>{finding.code}</code>
        </pre>
      )}
      <div className="flex items-start gap-2 text-xs text-zinc-400">
        <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
        <span>{finding.suggestion}</span>
      </div>
    </motion.div>
  );
}

function SummaryBar({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Badge variant="secondary" className="text-xs">
        Total: {summary.total}
      </Badge>
      {summary.critical > 0 && (
        <Badge className="bg-red-600/10 text-red-400 border border-red-600/20 text-xs">
          Critical: {summary.critical}
        </Badge>
      )}
      {summary.high > 0 && (
        <Badge className="bg-orange-600/10 text-orange-400 border border-orange-600/20 text-xs">
          High: {summary.high}
        </Badge>
      )}
      {summary.medium > 0 && (
        <Badge className="bg-yellow-600/10 text-yellow-400 border border-yellow-600/20 text-xs">
          Medium: {summary.medium}
        </Badge>
      )}
      {summary.low > 0 && (
        <Badge className="bg-blue-600/10 text-blue-400 border border-blue-600/20 text-xs">
          Low: {summary.low}
        </Badge>
      )}
      {summary.info > 0 && (
        <Badge className="bg-gray-600/10 text-gray-400 border border-gray-600/20 text-xs">
          Info: {summary.info}
        </Badge>
      )}
    </div>
  );
}

function ReviewCodeTab() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const runReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: code, filename: "file." + language, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Review failed");
      }
      const data: ReviewResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to review code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={runReview} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Code2 className="mr-2 h-4 w-4" />}
          Run Review
        </Button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here for review..."
        className="w-full h-64 rounded-lg border border-zinc-800 bg-black/60 p-4 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck={false}
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <SummaryBar summary={result.summary} />
          <div className="space-y-3">
            {result.findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
          {result.findings.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Code2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No issues found! Clean code.</p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          <Code2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Paste your code and click "Run Review" to get started</p>
        </div>
      )}
    </div>
  );
}

function ReviewPRTab() {
  const [filesJson, setFilesJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const runReview = async () => {
    let files: PRFile[];
    try {
      files = JSON.parse(filesJson);
      if (!Array.isArray(files) || files.length === 0) throw new Error();
    } catch {
      setError("Invalid JSON. Must be an array of { filename, content } objects.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "PR review failed");
      }
      const data: ReviewResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to review PR");
    } finally {
      setLoading(false);
    }
  };

  const filesByGroup = result
    ? result.findings.reduce<Record<string, ReviewFinding[]>>((acc, f) => {
        if (!acc[f.file]) acc[f.file] = [];
        acc[f.file].push(f);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Paste a JSON array of <code className="text-zinc-300">{"{filename, content}"}</code> objects
        </p>
        <Button onClick={runReview} disabled={loading || !filesJson.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 h-4 w-4" />}
          Review PR
        </Button>
      </div>

      <textarea
        value={filesJson}
        onChange={(e) => setFilesJson(e.target.value)}
        placeholder={`[\n  { "filename": "src/index.ts", "content": "const x = 1;" },\n  { "filename": "src/utils.ts", "content": "function foo() {}" }\n]`}
        className="w-full h-48 rounded-lg border border-zinc-800 bg-black/60 p-4 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck={false}
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <SummaryBar summary={result.summary} />
          <div className="space-y-6">
            {Object.entries(filesByGroup).map(([file, findings]) => (
              <div key={file}>
                <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  {file}
                  <Badge variant="outline" className="text-xs">
                    {findings.length} finding{findings.length !== 1 ? "s" : ""}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {findings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {result.findings.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <GitPullRequest className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No issues found across all files!</p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          <GitPullRequest className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Paste a JSON array of files and click "Review PR"</p>
        </div>
      )}
    </div>
  );
}

function ReviewFileTab() {
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const analyzeFile = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/code-review/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: code, filename: filename || "file." + language, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="filename.ts"
          className="flex-1 h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={analyzeFile} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Analyze
        </Button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste file content to analyze..."
        className="w-full h-64 rounded-lg border border-zinc-800 bg-black/60 p-4 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        spellCheck={false}
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <SummaryBar summary={result.summary} />
          <div className="space-y-3">
            {result.findings.map((finding: ReviewFinding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
          {result.findings.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No issues found in this file!</p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-zinc-500">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Paste file content and click "Analyze"</p>
        </div>
      )}
    </div>
  );
}

export function CodeReviewDashboardClient() {
  const [activeTab, setActiveTab] = useState("review-code");

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Code Review</h1>
            <p className="text-zinc-400">AI-powered code analysis and review</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-emerald-400" />
              Code Analysis
            </CardTitle>
            <CardDescription>
              Review your code for bugs, security issues, performance problems, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="review-code">
                  <Code2 className="mr-2 h-4 w-4" />
                  Review Code
                </TabsTrigger>
                <TabsTrigger value="review-pr">
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Review PR
                </TabsTrigger>
                <TabsTrigger value="review-file">
                  <FileText className="mr-2 h-4 w-4" />
                  Review File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="review-code">
                <ReviewCodeTab />
              </TabsContent>

              <TabsContent value="review-pr">
                <ReviewPRTab />
              </TabsContent>

              <TabsContent value="review-file">
                <ReviewFileTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
