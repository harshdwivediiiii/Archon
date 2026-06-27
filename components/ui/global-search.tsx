"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  FileCode,
  Database,
  GitBranch,
  BookOpen,
  Network,
  Loader2,
  Container,
  Ship,
  MessageSquare,
  Code2,
  Shield,
  GitCompare,
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SearchType =
  | "repository" | "service" | "api" | "database" | "document" | "diagram"
  | "kubernetes" | "docker" | "chat" | "code-review" | "security" | "devops" | "analytics";

interface SearchResult {
  id: string;
  type: SearchType;
  label: string;
  subtitle: string;
  href: string;
}

const typeIcons: Record<SearchType, React.ComponentType<{ className?: string }>> = {
  repository: GitBranch,
  service: FileCode,
  api: Network,
  database: Database,
  document: BookOpen,
  diagram: Network,
  kubernetes: Container,
  docker: Ship,
  chat: MessageSquare,
  "code-review": Code2,
  security: Shield,
  devops: GitCompare,
  analytics: BarChart3,
};

const typeColors: Record<SearchType, string> = {
  repository: "text-blue-400",
  service: "text-emerald-400",
  api: "text-purple-400",
  database: "text-amber-400",
  document: "text-zinc-400",
  diagram: "text-cyan-400",
  kubernetes: "text-indigo-400",
  docker: "text-sky-400",
  chat: "text-pink-400",
  "code-review": "text-lime-400",
  security: "text-red-400",
  devops: "text-orange-400",
  analytics: "text-yellow-400",
};

const typeLabels: Record<SearchType, string> = {
  repository: "Repository",
  service: "Service",
  api: "API",
  database: "Database",
  document: "Document",
  diagram: "Diagram",
  kubernetes: "Kubernetes",
  docker: "Docker",
  chat: "Chat",
  "code-review": "Code Review",
  security: "Security",
  devops: "DevOps",
  analytics: "Analytics",
};

const quickLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Code Review", href: "/dashboard/code-review", icon: Code2 },
  { label: "Documentation", href: "/dashboard/documentation", icon: FileText },
  { label: "Security", href: "/dashboard/security", icon: Shield },
  { label: "Database", href: "/dashboard/database", icon: Database },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "DevOps", href: "/dashboard/devops", icon: GitCompare },
  { label: "Kubernetes", href: "/dashboard/kubernetes", icon: Container },
  { label: "Docker", href: "/dashboard/docker", icon: Ship },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Team", href: "/dashboard/team", icon: Users },
];

const navShortcuts = [
  { key: "⌘K", action: "Toggle search" },
  { key: "↑↓", action: "Navigate results" },
  { key: "↵", action: "Open result" },
  { key: "Esc", action: "Close" },
];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const searchQuery = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchQuery(value), 300);
  }, [searchQuery]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        onClose();
        window.location.href = results[selectedIndex].href;
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [results, selectedIndex, onClose]
  );

  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const group = typeLabels[r.type] || r.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(r);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <Search className="h-5 w-5 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search across repositories, files, APIs..."
            className="flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No results found for &quot;{query}&quot;
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {Object.entries(groupedResults).map(([group, groupResults]) => (
                <div key={group}>
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {groupResults.map((result) => {
                      const Icon = typeIcons[result.type];
                      const globalIndex = results.indexOf(result);
                      return (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={result.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                            globalIndex === selectedIndex ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", typeColors[result.type])} />
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm text-white">{result.label}</p>
                            <p className="truncate text-xs text-zinc-500">{result.subtitle}</p>
                          </div>
                          <span className="shrink-0 text-xs capitalize text-zinc-600">
                            {typeLabels[result.type]}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-2">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-zinc-800 pt-3 px-3">
                <p className="text-xs text-zinc-600 mb-2">Keyboard Shortcuts</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {navShortcuts.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5">
                      <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
                        {s.key}
                      </kbd>
                      <span className="text-[11px] text-zinc-600">{s.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
