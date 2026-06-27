export interface SearchQuery {
  query: string;
  repositoryId?: string;
  fileType?: string;
  limit?: number;
  offset?: number;
}

export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  content: string;
  score: number;
  context?: {
    before: string[];
    after: string[];
  };
}

export interface SearchResult {
  matches: SearchMatch[];
  total: number;
  query: string;
  time: number;
}

const STORE_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "as", "is", "was", "are",
  "were", "be", "been", "being", "have", "has", "had", "do",
  "does", "did", "will", "would", "could", "should", "may",
  "might", "shall", "can", "this", "that", "these", "those",
  "it", "its", "it's", "not", "no", "nor", "so", "if",
  "then", "else", "than", "too", "very", "just", "about",
  "also", "into", "over", "such", "only", "other", "new",
  "more", "some", "any", "each", "which", "what", "when",
  "where", "how", "all", "both", "each", "few", "most",
  "own", "same", "while", "get", "got", "set", "let", "put",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_$]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STORE_WORDS.has(t));
}

function getFileTypeWeight(filename: string, queryFileType?: string): number {
  if (!queryFileType) return 1;

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const typeMap: Record<string, string[]> = {
    typescript: ["ts", "tsx", "mts"],
    javascript: ["js", "jsx", "mjs", "cjs"],
    python: ["py"],
    go: ["go"],
    rust: ["rs"],
    java: ["java"],
    ruby: ["rb"],
    php: ["php"],
    csharp: ["cs"],
    cpp: ["cpp", "cxx", "hpp"],
    c: ["c", "h"],
    swift: ["swift"],
    kotlin: ["kt", "kts"],
    scala: ["scala"],
    shell: ["sh", "bash", "zsh"],
    yaml: ["yml", "yaml"],
    html: ["html", "htm"],
    css: ["css", "scss", "sass", "less"],
    markdown: ["md", "mdx"],
    json: ["json"],
    sql: ["sql"],
    dockerfile: ["dockerfile"],
  };

  const normalizedQuery = queryFileType.toLowerCase().replace(/^\./, "");
  const exts = typeMap[normalizedQuery] || [normalizedQuery];

  return exts.includes(ext) ? 2 : 0.5;
}

function scoreFile(
  query: SearchQuery,
  filePath: string,
  content: string
): SearchMatch[] {
  const matches: SearchMatch[] = [];
  const queryTokens = tokenize(query.query);
  const queryLower = query.query.toLowerCase();
  const lines = content.split("\n");
  const fileName = filePath.split("/").pop() || filePath;

  if (queryTokens.length === 0) return [];

  const fileTypeWeight = getFileTypeWeight(filePath, query.fileType);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    let lineScore = 0;

    if (!lineLower.includes(queryTokens[0])) continue;

    const exactMatch = lineLower.includes(queryLower);
    if (exactMatch) {
      lineScore += 10 * fileTypeWeight;
    }

    const tokenMatches: string[] = [];
    for (const token of queryTokens) {
      if (lineLower.includes(token)) {
        tokenMatches.push(token);
        lineScore += 3 * fileTypeWeight;

        const wordBoundary = new RegExp(`\\b${token}\\b`);
        if (wordBoundary.test(lineLower)) {
          lineScore += 2 * fileTypeWeight;
        }
      }
    }

    if (tokenMatches.length === 0) continue;

    const queryWords = queryLower.split(/\s+/).filter(Boolean);
    const matchedPct = tokenMatches.length / queryWords.length;
    lineScore *= matchedPct;

    const sim = tokenMatches.length / new Set([...queryTokens, ...tokenMatches]).size;
    lineScore *= sim;

    const isFilename = filePath.toLowerCase().includes(queryLower);
    if (isFilename) {
      lineScore += 15;
    }

    const fileNameLower = fileName.toLowerCase();
    if (queryTokens.some((t) => fileNameLower.includes(t))) {
      lineScore += 5;
    }

    const isComment = line.trim().startsWith("//") || line.trim().startsWith("#") || line.trim().startsWith("/*") || line.trim().startsWith("*");
    if (isComment) {
      lineScore *= 0.8;
    }

    const isImport = line.trim().startsWith("import") || line.trim().startsWith("from") || line.trim().startsWith("require");
    if (isImport) {
      lineScore *= 0.7;
    }

    const isDefinition =
      /(?:function|class|const|let|var|type|interface|enum|def|fn)\s+\w+/i.test(line);
    if (isDefinition) {
      lineScore *= 1.5;
    }

    if (lineScore > 0) {
      const col = lineLower.indexOf(queryTokens[0]) + 1;
      const contextBefore = lines.slice(Math.max(0, i - 3), i);
      const contextAfter = lines.slice(i + 1, Math.min(lines.length, i + 4));

      matches.push({
        file: filePath,
        line: i + 1,
        column: col,
        content: line,
        score: Math.round(lineScore * 100) / 100,
        context: {
          before: contextBefore,
          after: contextAfter,
        },
      });
    }
  }

  return matches;
}

export function semanticSearch(
  query: SearchQuery,
  files: Array<{ path: string; content: string }>
): SearchResult {
  const startTime = performance.now();

  if (!query.query.trim()) {
    return {
      matches: [],
      total: 0,
      query: query.query,
      time: 0,
    };
  }

  const allMatches: SearchMatch[] = [];

  for (const file of files) {
    const fileMatches = scoreFile(query, file.path, file.content);
    allMatches.push(...fileMatches);
  }

  allMatches.sort((a, b) => b.score - a.score);

  const offset = query.offset ?? 0;
  const limit = query.limit ?? 50;
  const paginated = allMatches.slice(offset, offset + limit);

  const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    matches: paginated,
    total: allMatches.length,
    query: query.query,
    time: elapsed,
  };
}

export function searchCode(
  query: string,
  files: Array<{ path: string; content: string }>
): SearchResult {
  const startTime = performance.now();

  if (!query.trim()) {
    return {
      matches: [],
      total: 0,
      query,
      time: 0,
    };
  }

  const queryLower = query.toLowerCase();
  const allMatches: SearchMatch[] = [];

  for (const file of files) {
    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.toLowerCase().includes(queryLower)) {
        const col = line.toLowerCase().indexOf(queryLower) + 1;
        const contextBefore = lines.slice(Math.max(0, i - 2), i);
        const contextAfter = lines.slice(i + 1, Math.min(lines.length, i + 3));

        allMatches.push({
          file: file.path,
          line: i + 1,
          column: col,
          content: line,
          score: 1,
          context: {
            before: contextBefore,
            after: contextAfter,
          },
        });
      }
    }
  }

  const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    matches: allMatches.slice(0, 100),
    total: allMatches.length,
    query,
    time: elapsed,
  };
}
