export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "1y" | "all";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572a5",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Ruby: "#701516",
  PHP: "#4f5d95",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Scala: "#c22d40",
  Swift: "#ffac45",
  Dart: "#00b4ab",
  Lua: "#000080",
  Perl: "#0298c3",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  Erlang: "#b83998",
  Julia: "#a270ba",
  R: "#198ce7",
  Dockerfile: "#384d54",
  YAML: "#cb171e",
  JSON: "#292929",
  Markdown: "#083fa1",
  SQL: "#e38c00",
  GraphQL: "#e10098",
  Vue: "#4fc08d",
  Svelte: "#ff3e00",
  Solid: "#2c4f7c",
};

function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || "#6b7280";
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const extMap: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    kt: "Kotlin",
    kts: "Kotlin",
    rb: "Ruby",
    php: "PHP",
    c: "C",
    h: "C",
    cpp: "C++",
    cxx: "C++",
    hpp: "C++",
    cs: "C#",
    sh: "Shell",
    bash: "Shell",
    zsh: "Shell",
    html: "HTML",
    htm: "HTML",
    css: "CSS",
    scss: "CSS",
    sass: "CSS",
    less: "CSS",
    scala: "Scala",
    swift: "Swift",
    dart: "Dart",
    lua: "Lua",
    pl: "Perl",
    hs: "Haskell",
    ex: "Elixir",
    exs: "Elixir",
    clj: "Clojure",
    cljs: "Clojure",
    erl: "Erlang",
    jl: "Julia",
    r: "R",
    rmd: "R",
    dockerfile: "Dockerfile",
    yml: "YAML",
    yaml: "YAML",
    json: "JSON",
    md: "Markdown",
    mdx: "Markdown",
    sql: "SQL",
    graphql: "GraphQL",
    gql: "GraphQL",
    vue: "Vue",
    svelte: "Svelte",
    sol: "Solid",
  };
  return extMap[ext] || "Unknown";
}

export function getLanguageDistribution(
  files: Array<{ path: string; language?: string }>
): Array<{ language: string; percentage: number; files: number; lines: number; color: string }> {
  const langMap = new Map<
    string,
    { files: number; lines: number }
  >();
  let totalFiles = 0;

  for (const file of files) {
    const lang = file.language || detectLanguage(file.path);
    const existing = langMap.get(lang) || { files: 0, lines: 0 };
    existing.files++;
    totalFiles++;
    langMap.set(lang, existing);
  }

  const totalLines = Array.from(langMap.values()).reduce(
    (sum, l) => sum + l.lines,
    0
  );

  return Array.from(langMap.entries())
    .map(([language, data]) => ({
      language,
      percentage: totalFiles > 0 ? (data.files / totalFiles) * 100 : 0,
      files: data.files,
      lines: data.lines,
      color: getLanguageColor(language),
    }))
    .sort((a, b) => b.files - a.files);
}

export function getLinesOfCode(
  files: Array<{ path: string; lines: number }>
): {
  total: number;
  byLanguage: Record<string, number>;
  averages: { perFile: number };
} {
  const byLanguage: Record<string, number> = {};
  let total = 0;

  for (const file of files) {
    const lang = detectLanguage(file.path);
    byLanguage[lang] = (byLanguage[lang] || 0) + file.lines;
    total += file.lines;
  }

  return {
    total,
    byLanguage,
    averages: {
      perFile: files.length > 0 ? total / files.length : 0,
    },
  };
}

export function getCommitFrequency(
  commits: Array<{ date: string }>
): Array<{ date: string; count: number }> {
  const grouped = new Map<string, number>();

  for (const commit of commits) {
    const date = commit.date.slice(0, 10);
    grouped.set(date, (grouped.get(date) || 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getContributorActivity(
  commits: Array<{ author: string; date: string; lines: number }>
): Array<{
  author: string;
  commitCount: number;
  linesChanged: number;
  lastActive: string;
  firstActive: string;
}> {
  const contributorMap = new Map<
    string,
    {
      commitCount: number;
      linesChanged: number;
      dates: string[];
    }
  >();

  for (const commit of commits) {
    const existing = contributorMap.get(commit.author) || {
      commitCount: 0,
      linesChanged: 0,
      dates: [],
    };
    existing.commitCount++;
    existing.linesChanged += commit.lines;
    existing.dates.push(commit.date);
    contributorMap.set(commit.author, existing);
  }

  return Array.from(contributorMap.entries())
    .map(([author, data]) => ({
      author,
      commitCount: data.commitCount,
      linesChanged: data.linesChanged,
      lastActive: data.dates.sort().reverse()[0],
      firstActive: data.dates.sort()[0],
    }))
    .sort((a, b) => b.commitCount - a.commitCount);
}

export function getCodeOwnership(
  files: Array<{ path: string; contributors: string[] }>
): Array<{
  directory: string;
  primaryOwner: string;
  ownership: number;
  contributors: number;
}> {
  const dirMap = new Map<
    string,
    { contributorCommits: Map<string, number>; totalCommits: number }
  >();

  for (const file of files) {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "/";
    const existing = dirMap.get(dir) || {
      contributorCommits: new Map<string, number>(),
      totalCommits: 0,
    };

    for (const contributor of file.contributors) {
      existing.contributorCommits.set(
        contributor,
        (existing.contributorCommits.get(contributor) || 0) + 1
      );
      existing.totalCommits++;
    }

    dirMap.set(dir, existing);
  }

  return Array.from(dirMap.entries())
    .map(([directory, data]) => {
      let primaryOwner = "";
      let maxCommits = 0;

      for (const [contributor, commits] of data.contributorCommits) {
        if (commits > maxCommits) {
          maxCommits = commits;
          primaryOwner = contributor;
        }
      }

      return {
        directory,
        primaryOwner,
        ownership: data.totalCommits > 0 ? maxCommits / data.totalCommits : 0,
        contributors: data.contributorCommits.size,
      };
    })
    .sort((a, b) => b.contributors - a.contributors);
}

export function getChurnRate(
  commits: Array<{ date: string; linesAdded: number; linesRemoved: number }>,
  timeRange: AnalyticsTimeRange
): { rate: number; added: number; removed: number; netChange: number } {
  const now = Date.now();
  const rangeMap: Record<AnalyticsTimeRange, number> = {
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
    all: Infinity,
  };
  const cutoff = now - rangeMap[timeRange];

  const filtered = commits.filter(
    (c) => new Date(c.date).getTime() >= cutoff
  );

  const added = filtered.reduce((sum, c) => sum + c.linesAdded, 0);
  const removed = filtered.reduce((sum, c) => sum + c.linesRemoved, 0);

  const total = added + removed;
  const rate = total > 0 ? added / total : 0;

  return { rate, added, removed, netChange: added - removed };
}

export function assessTechnicalDebt(
  files: Array<{
    path: string;
    complexity?: number;
    duplications?: number;
    issues?: number;
  }>
): {
  score: number;
  level: string;
  hotspots: Array<{ file: string; score: number; reason: string }>;
} {
  const hotspots: Array<{ file: string; score: number; reason: string }> = [];
  let totalScore = 0;

  const maxComplexity = 10;
  const maxDuplications = 5;
  const maxIssues = 10;

  for (const file of files) {
    let fileScore = 0;
    const reasons: string[] = [];

    const complexity = file.complexity ?? 0;
    if (complexity > maxComplexity) {
      const cScore = Math.min(
        ((complexity - maxComplexity) / maxComplexity) * 40,
        40
      );
      fileScore += cScore;
      reasons.push(
        `High complexity: ${complexity} (threshold: ${maxComplexity})`
      );
    }

    const duplications = file.duplications ?? 0;
    if (duplications > maxDuplications) {
      const dScore = Math.min(
        ((duplications - maxDuplications) / maxDuplications) * 30,
        30
      );
      fileScore += dScore;
      reasons.push(
        `High duplication: ${duplications} blocks (threshold: ${maxDuplications})`
      );
    }

    const issues = file.issues ?? 0;
    if (issues > maxIssues) {
      const iScore = Math.min(
        ((issues - maxIssues) / maxIssues) * 30,
        30
      );
      fileScore += iScore;
      reasons.push(
        `Code issues: ${issues} (threshold: ${maxIssues})`
      );
    }

    if (fileScore > 0) {
      totalScore += fileScore;
      hotspots.push({
        file: file.path,
        score: Math.round(fileScore * 100) / 100,
        reason: reasons.join("; "),
      });
    }
  }

  const normalizedScore =
    files.length > 0
      ? Math.round((totalScore / files.length) * 100) / 100
      : 0;

  let level: string;
  if (normalizedScore <= 5) level = "low";
  else if (normalizedScore <= 15) level = "moderate";
  else if (normalizedScore <= 30) level = "high";
  else level = "critical";

  return {
    score: normalizedScore,
    level,
    hotspots: hotspots.sort((a, b) => b.score - a.score),
  };
}

export function getDependencyFreshness(
  deps: Record<string, string>,
  latestVersions: Record<string, string>
): Array<{
  name: string;
  current: string;
  latest: string;
  behind: number;
  status: "current" | "minor" | "major" | "unknown";
}> {
  function parseVersion(v: string): { major: number; minor: number; patch: number } | null {
    const cleaned = v.replace(/^[\^~>=<]/, "");
    const parts = cleaned.split(".");
    if (parts.length < 2) return null;
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    const patch = parts[2] ? parseInt(parts[2], 10) : 0;
    if (isNaN(major) || isNaN(minor)) return null;
    return { major, minor, patch };
  }

  return Object.entries(deps).map(([name, current]) => {
    const latest = latestVersions[name];
    if (!latest) {
      return { name, current, latest: "unknown", behind: 0, status: "unknown" };
    }

    const currentParsed = parseVersion(current);
    const latestParsed = parseVersion(latest);

    if (!currentParsed || !latestParsed) {
      return { name, current, latest, behind: 0, status: "unknown" };
    }

    let status: "current" | "minor" | "major" | "unknown";
    let behind = 0;

    if (latestParsed.major > currentParsed.major) {
      status = "major";
      behind = latestParsed.major - currentParsed.major;
    } else if (
      latestParsed.major === currentParsed.major &&
      latestParsed.minor > currentParsed.minor
    ) {
      status = "minor";
      behind = latestParsed.minor - currentParsed.minor;
    } else if (
      latestParsed.major === currentParsed.major &&
      latestParsed.minor === currentParsed.minor &&
      latestParsed.patch > currentParsed.patch
    ) {
      status = "minor";
      behind = latestParsed.patch - currentParsed.patch;
    } else {
      status = "current";
    }

    return { name, current, latest, behind, status };
  });
}
