"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
  FileText,
  BookOpen,
  Code2,
  Database,
  Box,
  Rocket,
  GitFork,
  Megaphone,
  ListOrdered,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileSearch,
  Copy,
  Check,
  Sparkles,
  Eye,
  Edit3,
} from "lucide-react";
import type { DocType, GeneratedDoc } from "@/lib/documentation";
import { getDocTypeLabel } from "@/lib/documentation";

const DOC_TYPE_ICONS: Record<DocType, React.ComponentType<{ className?: string }>> = {
  README: BookOpen,
  API_DOCUMENTATION: Code2,
  ARCHITECTURE: FileText,
  DATABASE: Database,
  COMPONENT: Box,
  DEPLOYMENT_GUIDE: Rocket,
  CONTRIBUTING_GUIDE: GitFork,
  RELEASE_NOTES: Megaphone,
  CHANGELOG: ListOrdered,
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  README: "text-blue-400",
  API_DOCUMENTATION: "text-purple-400",
  ARCHITECTURE: "text-cyan-400",
  DATABASE: "text-amber-400",
  COMPONENT: "text-emerald-400",
  DEPLOYMENT_GUIDE: "text-orange-400",
  CONTRIBUTING_GUIDE: "text-pink-400",
  RELEASE_NOTES: "text-indigo-400",
  CHANGELOG: "text-rose-400",
};

function generateMockDoc(type: DocType, context: string): GeneratedDoc {
  const typeLabel = getDocTypeLabel(type);
  return {
    type,
    title: `${typeLabel} Documentation`,
    sections: [
      {
        title: "Overview",
        content: `This is auto-generated ${typeLabel.toLowerCase()} documentation for the project described below.\n\nThe system architecture follows a modular, service-oriented design pattern with clear separation of concerns across the codebase.`,
        level: 2,
      },
      {
        title: "Context",
        content: context || "No context provided.",
        level: 2,
      },
      {
        title: "Key Components",
        content: `The project encompasses several key components:\n\n- **Core Engine**: The central processing unit handling business logic\n- **API Layer**: RESTful endpoints for external communication\n- **Data Layer**: Database interactions and data persistence\n- **UI Components**: Frontend user interface elements\n\nEach component is designed to be independently testable and deployable.`,
        level: 2,
      },
      {
        title: "Technical Details",
        content: "```typescript\ninterface SystemConfig {\n  name: string;\n  version: string;\n  components: Component[];\n  dependencies: Record<string, string>;\n}\n\nconst config: SystemConfig = {\n  name: \"Archon\",\n  version: \"1.0.0\",\n  components: [],\n  dependencies: {},\n};\n```",
        level: 3,
      },
    ],
    raw: "",
    metadata: {
      generatedAt: new Date().toISOString(),
      context,
    },
  };
}

function MarkdownPreview({ doc }: { doc: GeneratedDoc }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = doc.sections
      .map((s) => `${"#".repeat(s.level)} ${s.title}\n\n${s.content}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{doc.title}</h2>
          <span className="rounded-full border border-[#414754] bg-[#1c1f27] px-2 py-0.5 text-[11px] text-zinc-400">
            {getDocTypeLabel(doc.type)}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="rounded-lg border border-[#414754] bg-[#1c1f27]/50 p-6">
        {doc.sections.map((section, i) => (
          <div key={i} className="mb-6 last:mb-0">
            <div
              className={cn(
                "font-semibold text-white mb-3",
                section.level === 1 && "text-2xl",
                section.level === 2 && "text-xl",
                section.level === 3 && "text-lg",
                section.level >= 4 && "text-base"
              )}
            >
              {section.title}
            </div>
            <div className="prose prose-invert max-w-none">
              {section.content.split("\n").map((line, j) => {
                if (line.startsWith("```")) {
                  const lang = line.slice(3).trim();
                  const codeLines: string[] = [];
                  let k = j + 1;
                  while (k < section.content.split("\n").length && !section.content.split("\n")[k].startsWith("```")) {
                    codeLines.push(section.content.split("\n")[k]);
                    k++;
                  }
                  if (codeLines.length > 0) {
                    return (
                      <pre key={j} className="my-3 rounded-lg bg-black/60 p-4 overflow-x-auto">
                        <code className="text-sm text-zinc-200 font-mono">{codeLines.join("\n")}</code>
                      </pre>
                    );
                  }
                  return null;
                }
                if (line.startsWith("- **")) {
                  const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
                  if (match) {
                    return (
                      <div key={j} className="flex gap-2 text-sm text-zinc-300 mb-1">
                        <span className="text-zinc-500">•</span>
                        <strong className="text-zinc-100">{match[1]}</strong>
                        {match[2] && <span>{match[2]}</span>}
                      </div>
                    );
                  }
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={j} className="flex gap-2 text-sm text-zinc-300 mb-1">
                      <span className="text-zinc-500">•</span>
                      <span>{line.slice(2)}</span>
                    </div>
                  );
                }
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <div key={j} className="flex gap-2 text-sm text-zinc-300 mb-1">
                      <span className="text-zinc-500">{line.match(/^\d+\./)?.[0]}</span>
                      <span>{line.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  );
                }
                if (line.trim() === "") {
                  return <div key={j} className="h-2" />;
                }
                return (
                  <p key={j} className="text-sm text-zinc-300 leading-relaxed mb-2">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Generated {new Date(doc.metadata.generatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

export function DocumentationClient() {
  const [docType, setDocType] = useState<DocType>("README");
  const [context, setContext] = useState("");
  const [repositoryInfo, setRepositoryInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<GeneratedDoc | null>(null);
  const [useMock, setUseMock] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!context.trim()) return;

    setLoading(true);
    setError(null);
    setDoc(null);

    try {
      if (useMock) {
        await new Promise((r) => setTimeout(r, 1500));
        setDoc(generateMockDoc(docType, context));
        return;
      }

      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          context: context.trim(),
          repositoryInfo: repositoryInfo.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Failed to generate documentation");
      }

      const data = await res.json();
      setDoc(data.doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate documentation");
    } finally {
      setLoading(false);
    }
  }, [docType, context, repositoryInfo, useMock]);

  const DocIcon = DOC_TYPE_ICONS[docType];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Documentation</h1>
            <p className="text-zinc-400">AI-powered documentation generation for your projects</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseMock(!useMock)}
              className={cn(useMock && "border-amber-500/50 text-amber-400")}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {useMock ? "Mock: ON" : "Mock: OFF"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Edit3 className="h-4 w-4 text-blue-400" />
                  Documentation Inputs
                </CardTitle>
                <CardDescription>
                  Configure the documentation type and provide context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Documentation Type
                  </label>
                  <Select value={docType} onValueChange={(v) => { setDocType(v as DocType); setDoc(null); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DOC_TYPE_ICONS) as DocType[]).map((type) => {
                        const Icon = DOC_TYPE_ICONS[type];
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn("h-4 w-4", DOC_TYPE_COLORS[type])} />
                              <span>{getDocTypeLabel(type)}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Project / Repository Context
                  </label>
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder={`Describe your project, repository, or codebase here...

For example:
- What does this project do?
- What technologies does it use?
- What are the main components?
- Any specific patterns or conventions?`}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Repository / File Information
                    <span className="text-zinc-500 ml-1.5 font-normal">(optional)</span>
                  </label>
                  <Textarea
                    value={repositoryInfo}
                    onChange={(e) => setRepositoryInfo(e.target.value)}
                    placeholder={`Repository structure, file paths, or additional info...

For example:
/src/components/
/src/lib/
/src/app/
package.json
tsconfig.json`}
                    className="min-h-[100px] font-mono text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !context.trim()}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    {loading ? "Generating..." : "Generate Documentation"}
                  </Button>
                  {doc && (
                    <Button variant="outline" onClick={() => { setDoc(null); setError(null); }}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {doc && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileSearch className="h-4 w-4 text-emerald-400" />
                    Document Sections
                  </CardTitle>
                  <CardDescription>
                    {doc.sections.length} section{doc.sections.length !== 1 ? "s" : ""} generated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {doc.sections.map((section, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#272a32] transition-colors"
                      >
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            section.level === 1 && "bg-blue-400",
                            section.level === 2 && "bg-emerald-400",
                            section.level >= 3 && "bg-zinc-500"
                          )}
                        />
                        <span
                          className={cn(
                            "truncate",
                            section.level === 1 && "font-semibold text-white",
                            section.level === 2 && "font-medium"
                          )}
                        >
                          {"  ".repeat(section.level - 1)}{section.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            {loading ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    Generating Documentation
                  </CardTitle>
                  <CardDescription>
                    AI is generating your {getDocTypeLabel(docType).toLowerCase()}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <div className="space-y-2 mt-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className={cn(
                          "rounded-lg",
                          i % 3 === 0 ? "h-24" : "h-4",
                          i % 3 === 0 ? "w-full" : `w-${(i % 3 === 1 ? "3/4" : "2/3")}`
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Generation Failed</h3>
                  <p className="text-sm text-zinc-400 text-center max-w-md mb-6">{error}</p>
                  <Button onClick={handleGenerate}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : doc ? (
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[calc(100vh-16rem)]">
                    <div className="p-6">
                      <MarkdownPreview doc={doc} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-6 rounded-2xl bg-[#0070f3]/10 p-4">
                    <FileText className="h-10 w-10 text-[#0070f3]" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    No Documentation Generated Yet
                  </h2>
                  <p className="text-zinc-400 text-center max-w-md mb-8">
                    Select a documentation type, provide context about your project,
                    and click "Generate Documentation" to create AI-powered docs.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {(Object.keys(DOC_TYPE_ICONS) as DocType[]).slice(0, 5).map((type) => {
                      const Icon = DOC_TYPE_ICONS[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setDocType(type)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border border-[#414754] bg-[#1c1f27] px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#272a32] hover:text-white transition-colors",
                            docType === type && "border-[#0070f3]/50 bg-[#0070f3]/10 text-[#0070f3]"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {getDocTypeLabel(type)}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
