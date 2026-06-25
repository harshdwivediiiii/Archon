"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, FileCode, Database, GitBranch, BookOpen, Network, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchResult {
  id: string;
  type: "repository" | "service" | "api" | "database" | "document" | "diagram";
  label: string;
  subtitle: string;
  href: string;
}

const typeIcons = {
  repository: GitBranch,
  service: FileCode,
  api: Network,
  database: Database,
  document: BookOpen,
  diagram: Network,
};

const typeColors = {
  repository: "text-blue-400",
  service: "text-emerald-400",
  api: "text-purple-400",
  database: "text-amber-400",
  document: "text-zinc-400",
  diagram: "text-cyan-400",
};

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
            placeholder="Search files, APIs, services, databases..."
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
            <div className="space-y-0.5">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      index === selectedIndex ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", typeColors[result.type])} />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm text-white">{result.label}</p>
                      <p className="truncate text-xs text-zinc-500">{result.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs capitalize text-zinc-600">
                      {result.type}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {query.length < 2 && (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-600">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
