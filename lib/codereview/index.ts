export type ReviewSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ReviewCategory =
  | "bug"
  | "security"
  | "performance"
  | "readability"
  | "naming"
  | "complexity"
  | "suggestion"
  | "code_smell"
  | "duplication";

export interface ReviewFinding {
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

export interface ReviewResult {
  findings: ReviewFinding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    categories: Record<ReviewCategory, number>;
  };
}

interface CodePattern {
  id: string;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  suggestion: string;
  test: (line: string, lineNumber: number, content: string) => boolean;
}

let findingCounter = 0;

function nextId(prefix: string): string {
  return `rev-${prefix}-${++findingCounter}`;
}

function makeSummary(findings: ReviewFinding[]): ReviewResult["summary"] {
  const summary: ReviewResult["summary"] = {
    total: findings.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    categories: {
      bug: 0,
      security: 0,
      performance: 0,
      readability: 0,
      naming: 0,
      complexity: 0,
      suggestion: 0,
      code_smell: 0,
      duplication: 0,
    },
  };

  for (const f of findings) {
    if (f.severity === "critical") summary.critical++;
    else if (f.severity === "high") summary.high++;
    else if (f.severity === "medium") summary.medium++;
    else if (f.severity === "low") summary.low++;
    else if (f.severity === "info") summary.info++;
    summary.categories[f.category]++;
  }

  return summary;
}

const LANGUAGE_EXTENSIONS: Record<string, string[]> = {
  typescript: [".ts", ".tsx", ".mts"],
  javascript: [".js", ".jsx", ".mjs", ".cjs"],
  python: [".py"],
  go: [".go"],
  rust: [".rs"],
  java: [".java"],
  ruby: [".rb"],
  php: [".php"],
  csharp: [".cs"],
  cpp: [".cpp", ".cxx", ".hpp"],
  c: [".c", ".h"],
  swift: [".swift"],
  kotlin: [".kt", ".kts"],
  scala: [".scala"],
  shell: [".sh", ".bash", ".zsh"],
  yaml: [".yml", ".yaml"],
  html: [".html", ".htm"],
  css: [".css", ".scss", ".sass", ".less"],
};

function getLanguage(filename: string): string | null {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  for (const [lang, exts] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if (exts.includes(ext)) return lang;
  }
  return null;
}

const BUG_PATTERNS: CodePattern[] = [
  {
    id: "empty-catch",
    severity: "high",
    category: "bug",
    message: "Empty catch block silently swallows an exception",
    suggestion: "Handle the error appropriately, log it, or re-throw. Never leave catch blocks empty.",
    test: (line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("catch") && trimmed.includes("{}")) return true;
      if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "assignment-in-condition",
    severity: "high",
    category: "bug",
    message: "Assignment in conditional expression - possible typo",
    suggestion: "Use '===' for comparison instead of '='. If intentional, wrap in extra parentheses.",
    test: (line) => {
      const trimmed = line.trim();
      if (/if\s*\([^)]*=[^=][^)]*\)/.test(trimmed) && !/==|===/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "nan-comparison",
    severity: "high",
    category: "bug",
    message: "Direct NaN comparison - will always be false",
    suggestion: "Use Number.isNaN() or x !== x pattern to check for NaN.",
    test: (line) => {
      const trimmed = line.trim();
      if (/===?\s*NaN/.test(trimmed) || /NaN\s*===?/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "loose-comparison",
    severity: "low",
    category: "bug",
    message: "Loose equality (==) can cause unexpected type coercion",
    suggestion: "Use strict equality (===) instead of loose equality (==).",
    test: (line) => {
      const trimmed = line.trim();
      if (/\btypeof\s/.test(trimmed)) return false;
      const matches = trimmed.match(/[^!><=]==[^=]/);
      if (matches && !trimmed.includes("===")) return true;
      return false;
    },
  },
  {
    id: "promise-no-await",
    severity: "medium",
    category: "bug",
    message: "Promise created without being awaited or returned",
    suggestion: "Add 'await' before the promise or return it to handle the async result.",
    test: (line) => {
      const trimmed = line.trim();
      if (/new\s+Promise\s*\(/.test(trimmed) && !trimmed.startsWith("return ") && !trimmed.startsWith("await ")) return true;
      return false;
    },
  },
  {
    id: "console-statement",
    severity: "info",
    category: "code_smell",
    message: "Console statement left in code",
    suggestion: "Remove console.log or replace with a proper logging framework.",
    test: (line) => {
      const trimmed = line.trim();
      if (/^console\.(log|debug|info|warn|error)\s*\(/.test(trimmed) && !trimmed.includes("// eslint-disable") && !trimmed.includes("/* eslint-disable")) return true;
      return false;
    },
  },
];

const SECURITY_PATTERNS: CodePattern[] = [
  {
    id: "eval-usage",
    severity: "critical",
    category: "security",
    message: "eval() executes arbitrary code - major security risk",
    suggestion: "Avoid eval() entirely. Use JSON.parse() for JSON, Function constructor only if absolutely necessary with sanitized input.",
    test: (line) => {
      if (/\beval\s*\(/.test(line.trim())) return true;
      return false;
    },
  },
  {
    id: "innerHTML",
    severity: "high",
    category: "security",
    message: "innerHTML assignment can lead to XSS vulnerabilities",
    suggestion: "Use textContent for text, or create elements with document.createElement() and set attributes safely.",
    test: (line) => {
      if (/\.innerHTML\s*=/.test(line.trim())) return true;
      return false;
    },
  },
  {
    id: "sql-concatenation",
    severity: "critical",
    category: "security",
    message: "SQL query constructed via string concatenation - SQL injection risk",
    suggestion: "Use parameterized queries or prepared statements. Never interpolate user input directly into SQL.",
    test: (line) => {
      const trimmed = line.trim();
      if (/\b(execute|query|run)\s*\(/.test(trimmed) && /\$[\{\(]/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "command-injection",
    severity: "critical",
    category: "security",
    message: "Shell command constructed with string interpolation - command injection risk",
    suggestion: "Use execFile/spawn with arguments array instead of exec(). Validate and sanitize all user input.",
    test: (line) => {
      const trimmed = line.trim();
      if (/(exec|execSync|spawn|spawnSync)\s*\(/.test(trimmed) && /`/.test(trimmed) && /\$\{/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "hardcoded-secret",
    severity: "critical",
    category: "security",
    message: "Possible hardcoded secret or credential",
    suggestion: "Use environment variables or a secret manager. Never hardcode secrets in source code.",
    test: (line) => {
      const trimmed = line.trim();
      const secretPatterns = [
        /(?:password|pwd|secret|api[_-]?key|token|credential|auth)[\s]*[:=][\s]*['"][^'"]{8,}['"]/i,
        /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/,
        /sk-[A-Za-z0-9]{32,}/,
        /(?:-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/,
        /(?:AKIA[0-9A-Z]{16})/,
        /(?:xox[abpr]-[0-9a-z-]{24,})/,
      ];
      for (const pattern of secretPatterns) {
        if (pattern.test(trimmed) && !trimmed.includes("process.env") && !trimmed.includes("import.meta.env")) return true;
      }
      return false;
    },
  },
];

const PERFORMANCE_PATTERNS: CodePattern[] = [
  {
    id: "nested-loop",
    severity: "medium",
    category: "performance",
    message: "Nested loop detected - potential O(n²) performance issue",
    suggestion: "Consider using a Map or Set for lookups, or restructure the algorithm to reduce complexity.",
    test: (line, _lineNumber, content) => {
      const trimmed = line.trim();
      if (/\bfor\s*\(/.test(trimmed) || /\bwhile\s*\(/.test(trimmed) || /\.forEach\s*\(/.test(trimmed)) {
        const lines = content.split("\n");
        const idx = lines.indexOf(line);
        let depth = 0;
        for (let i = 0; i <= idx; i++) {
          const l = lines[i].trim();
          if (/\bfor\s*\(/.test(l) || /\bwhile\s*\(/.test(l) || /\.forEach\s*\(/.test(l)) depth++;
          if (l.includes("}")) depth = Math.max(0, depth - 1);
        }
        if (depth > 1) return true;
      }
      return false;
    },
  },
  {
    id: "large-array-spread",
    severity: "low",
    category: "performance",
    message: "Spreading large arrays creates a copy - potential memory issue",
    suggestion: "Use .concat() or push with spread only for small arrays. For large datasets, consider using generators or iterators.",
    test: (line) => {
      const trimmed = line.trim();
      if (/\.\.\./.test(trimmed) && /\bpush\b/.test(trimmed)) return true;
      if (/\.\.\.[a-zA-Z_]\w*\s*\]/.test(trimmed) && trimmed.includes("[")) return true;
      return false;
    },
  },
  {
    id: "inefficient-regex",
    severity: "low",
    category: "performance",
    message: "RegExp literal inside a loop - recompiles on each iteration",
    suggestion: "Hoist the RegExp to a variable outside the loop so it is compiled once.",
    test: (line) => {
      const trimmed = line.trim();
      if (/\/[^/]+\/[gimsu]*/.test(trimmed) && !trimmed.startsWith("const") && !trimmed.startsWith("let") && !trimmed.startsWith("var")) return true;
      return false;
    },
  },
  {
    id: "unnecessary-re-render",
    severity: "medium",
    category: "performance",
    message: "Inline function/object in JSX prop - creates new reference on each render",
    suggestion: "Extract the function/object outside the render or use useCallback/useMemo.",
    test: (line) => {
      const trimmed = line.trim();
      if (/on\w+\s*=\s*\{[^}]*=>/.test(trimmed) || /on\w+\s*=\s*\{[^}]*function\s*\(/.test(trimmed)) return true;
      return false;
    },
  },
];

const READABILITY_PATTERNS: CodePattern[] = [
  {
    id: "long-function",
    severity: "medium",
    category: "readability",
    message: "Function is too long (heuristic line count per function exceeds threshold)",
    suggestion: "Break down the function into smaller, focused functions. Each function should do one thing.",
    test: (line, _lineNumber, content) => {
      const trimmed = line.trim();
      if (
        /^(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(/.test(trimmed) ||
        /^(?:export\s+)?(?:async\s+)?\([^)]*\)\s*=>\s*{/.test(trimmed) ||
        /\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(trimmed)
      ) {
        const lines = content.split("\n");
        const startIdx = lines.indexOf(line);
        let braceCount = 0;
        let functionLines = 0;
        let started = false;
        for (let i = startIdx; i < lines.length; i++) {
          for (const ch of lines[i]) {
            if (ch === "{") { braceCount++; started = true; }
            else if (ch === "}") { braceCount--; }
          }
          if (started) functionLines++;
          if (braceCount === 0 && started) break;
        }
        if (functionLines > 60) return true;
      }
      return false;
    },
  },
  {
    id: "deep-nesting",
    severity: "medium",
    category: "readability",
    message: "Deeply nested code (nesting level > 4)",
    suggestion: "Use early returns, guard clauses, or extract nested logic into separate functions.",
    test: (line, _lineNumber, content) => {
      const trimmed = line.trim();
      if (/^\s*(if|for|while|switch)\b/.test(trimmed) || trimmed === "{" || trimmed === "}") {
        const lines = content.split("\n");
        const idx = lines.indexOf(line);
        let depth = 0;
        for (let i = 0; i <= idx; i++) {
          for (const ch of lines[i]) {
            if (ch === "{") depth++;
            else if (ch === "}") depth = Math.max(0, depth - 1);
          }
        }
        if (depth > 4) return true;
      }
      return false;
    },
  },
  {
    id: "magic-number",
    severity: "low",
    category: "readability",
    message: "Magic number used without explanation",
    suggestion: "Extract the number into a named constant with a descriptive name.",
    test: (line) => {
      const trimmed = line.trim();
      if (
        !trimmed.startsWith("//") && !trimmed.startsWith("const") &&
        !trimmed.startsWith("let") && !trimmed.startsWith("var") && !trimmed.includes("0x")
      ) {
        if (trimmed.match(/\b[3-9]\d{2,}\b/)) return true;
      }
      return false;
    },
  },
];

const NAMING_PATTERNS: CodePattern[] = [
  {
    id: "single-letter-var",
    severity: "low",
    category: "naming",
    message: "Single-letter variable name reduces readability",
    suggestion: "Use a descriptive name that conveys the purpose of the variable, except for loop indices (i, j, k).",
    test: (line) => {
      const trimmed = line.trim();
      const matches = trimmed.match(/\b(?:const|let|var)\s+([a-zA-Z])\b/g);
      if (matches) {
        for (const m of matches) {
          const varName = m.split(/\s+/).pop() || "";
          if (!["i", "j", "k", "n", "x", "y", "z"].includes(varName)) return true;
        }
      }
      return false;
    },
  },
  {
    id: "inconsistent-casing",
    severity: "low",
    category: "naming",
    message: "Possibly inconsistent naming convention detected",
    suggestion: "Follow consistent casing: camelCase for variables/functions, PascalCase for classes/types, UPPER_CASE for constants.",
    test: (line) => {
      const trimmed = line.trim();
      if (/(?:const|let|var)\s+[a-z]+_[a-z]+\s*=/.test(trimmed)) {
        const name = trimmed.match(/(?:const|let|var)\s+([a-zA-Z_]\w*)/)?.[1];
        if (name && name.includes("_") && !name.match(/^[A-Z_]+$/) && !name.startsWith("_")) return true;
      }
      return false;
    },
  },
  {
    id: "short-param-name",
    severity: "info",
    category: "naming",
    message: "Function parameter is very short and unclear",
    suggestion: "Use descriptive parameter names that indicate the purpose and type of the parameter.",
    test: (line) => {
      const trimmed = line.trim();
      if (/function\s+\w+\s*\(/.test(trimmed) || /=>\s*{/.test(trimmed) || /\([^)]*\)\s*=>\s*{/.test(trimmed)) {
        const params = trimmed.match(/\(([^)]*)\)/)?.[1] || "";
        const paramList = params.split(",").map((p) => p.trim()).filter(Boolean);
        for (const param of paramList) {
          const name = param.replace(/^\.\.\./, "").replace(/:.*$/, "").trim();
          if (name.length === 1 && !["i", "j", "k", "n", "x", "y", "z", "e", "t", "s", "o", "r", "d"].includes(name)) return true;
        }
      }
      return false;
    },
  },
];

const COMPLEXITY_PATTERNS: CodePattern[] = [
  {
    id: "cyclomatic-complexity",
    severity: "medium",
    category: "complexity",
    message: "High cyclomatic complexity in this function",
    suggestion: "Break the function into smaller pieces. Consider using switch statements, polymorphism, or strategy pattern.",
    test: (line, _lineNumber, content) => {
      const trimmed = line.trim();
      if (/^(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(/.test(trimmed) || /\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/.test(trimmed)) {
        const lines = content.split("\n");
        const startIdx = lines.indexOf(line);
        let braceCount = 0;
        let started = false;
        let branchCount = 1;
        for (let i = startIdx; i < lines.length; i++) {
          for (const ch of lines[i]) {
            if (ch === "{") { braceCount++; started = true; }
            else if (ch === "}") { braceCount--; }
          }
          if (!started) continue;
          const stripped = lines[i].replace(/\/\/.*$/, "").replace(/\/\*[\s\S]*?\*\//g, "");
          const branches = (stripped.match(/\b(?:if|else\s+if|for|while|case\s+\w+|catch|&&|\|\|)\b/g) || []).length;
          branchCount += branches;
          if (braceCount === 0 && started) break;
        }
        if (branchCount > 10) return true;
      }
      return false;
    },
  },
];

const CODE_SMELL_PATTERNS: CodePattern[] = [
  {
    id: "commented-code",
    severity: "low",
    category: "code_smell",
    message: "Commented-out code detected",
    suggestion: "Remove dead code instead of commenting it out. Use version control to track history.",
    test: (line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("// ") && /(?:function|class|const|let|var|if|for|while|return)\s/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "todo-fixme",
    severity: "info",
    category: "code_smell",
    message: "TODO or FIXME comment found",
    suggestion: "Address the task described in the comment or create a ticket to track it.",
    test: (line) => {
      if (/(?:TODO|FIXME|HACK|XXX|TEMP|WORKAROUND|BUG|HARDCODED)/i.test(line.trim())) return true;
      return false;
    },
  },
  {
    id: "duplicate-block",
    severity: "medium",
    category: "duplication",
    message: "Possible code duplication (similar block detected)",
    suggestion: "Extract the duplicated code into a shared function or module.",
    test: (line, _lineNumber, content) => {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("import") || trimmed.startsWith("export")) return false;
      const lines = content.split("\n");
      const idx = lines.indexOf(line);
      const block = lines.slice(Math.max(0, idx - 2), idx + 3).join("\n");
      if (block.length < 40) return false;
      let count = 0;
      let pos = 0;
      while (pos < content.length) {
        const found = content.indexOf(block, pos);
        if (found === -1) break;
        count++;
        pos = found + 1;
      }
      if (count > 1) return true;
      return false;
    },
  },
  {
    id: "large-file",
    severity: "low",
    category: "code_smell",
    message: "File is very large - hard to navigate and maintain",
    suggestion: "Split the file into smaller modules based on responsibility.",
    test: (_line, _lineNumber, content) => {
      if (content.split("\n").length > 500) return true;
      return false;
    },
  },
];

const SUGGESTION_PATTERNS: CodePattern[] = [
  {
    id: "use-optional-chaining",
    severity: "info",
    category: "suggestion",
    message: "Use optional chaining (?.) instead of manual null check",
    suggestion: "Replace verbose null checks with optional chaining: obj?.prop?.nested instead of obj && obj.prop && obj.prop.nested.",
    test: (line) => {
      const trimmed = line.trim();
      if (/&&\s+\w+\s*&&\s+\w+\./.test(trimmed) && !trimmed.includes("?.(") && (trimmed.includes("typeof") || trimmed.includes("!= null") || /&&\s*\w+\s*\./.test(trimmed))) return true;
      return false;
    },
  },
  {
    id: "use-nullish-coalescing",
    severity: "info",
    category: "suggestion",
    message: "Use nullish coalescing (??) instead of || for default values",
    suggestion: "Replace `x || defaultValue` with `x ?? defaultValue` when you want to treat only null/undefined as absent, not empty strings or 0.",
    test: (line) => {
      const trimmed = line.trim();
      if (/\|\|/.test(trimmed) && !trimmed.includes("??") && /(?:const|let|var)\s/.test(trimmed) && /\|\|\s*['"a-zA-Z0-9_]/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "use-array-methods",
    severity: "info",
    category: "suggestion",
    message: "Use array methods like .map(), .filter(), .reduce() instead of manual loops",
    suggestion: "Replace manual for loops with functional array methods for cleaner, more declarative code.",
    test: (line) => {
      const trimmed = line.trim();
      if (/^\s*for\s*\(/.test(trimmed) && trimmed.includes(".length") && trimmed.includes("++")) return true;
      return false;
    },
  },
  {
    id: "use-template-literals",
    severity: "info",
    category: "suggestion",
    message: "Use template literals instead of string concatenation",
    suggestion: "Replace `'hello ' + name` with `hello ${name}` for better readability.",
    test: (line) => {
      const trimmed = line.trim();
      if (!trimmed.includes("`") && /['"\)]\s*\+/.test(trimmed) && /\+/.test(trimmed) && !trimmed.includes("//") && !trimmed.includes("import")) return true;
      return false;
    },
  },
  {
    id: "use-destructuring",
    severity: "info",
    category: "suggestion",
    message: "Use destructuring assignment for cleaner code",
    suggestion: "Replace `const x = obj.x; const y = obj.y;` with `const { x, y } = obj;`.",
    test: (line) => {
      const trimmed = line.trim();
      if (/const\s+\w+\s*=\s*\w+\.\w+/.test(trimmed) && !trimmed.includes("{") && /const\s+\w+\s*=\s*\w+\.\w+/.test(trimmed)) return true;
      return false;
    },
  },
  {
    id: "use-async-await",
    severity: "info",
    category: "suggestion",
    message: "Use async/await instead of .then() chains",
    suggestion: "Replace promise chains with async/await for better readability and error handling.",
    test: (line) => {
      if (/\.then\s*\(/.test(line.trim()) && !line.includes("await")) return true;
      return false;
    },
  },
];

const ALL_PATTERNS: CodePattern[] = [
  ...BUG_PATTERNS,
  ...SECURITY_PATTERNS,
  ...PERFORMANCE_PATTERNS,
  ...READABILITY_PATTERNS,
  ...NAMING_PATTERNS,
  ...COMPLEXITY_PATTERNS,
  ...CODE_SMELL_PATTERNS,
  ...SUGGESTION_PATTERNS,
];

function analyzeContent(content: string, filename: string): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const lines = content.split("\n");
  const seenBlocks = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of ALL_PATTERNS) {
      if (!pattern.test(line, i + 1, content)) continue;

      const code = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join("\n");
      const blockKey = `${pattern.id}:${i}`;
      if (seenBlocks.has(blockKey)) continue;
      seenBlocks.add(blockKey);

      findings.push({
        id: nextId(pattern.id),
        severity: pattern.severity,
        category: pattern.category,
        message: pattern.message,
        file: filename,
        lineStart: i + 1,
        lineEnd: i + 1,
        suggestion: pattern.suggestion,
        code,
      });
    }
  }

  return findings;
}

export function reviewCode(content: string, filename: string, _language: string): ReviewResult {
  findingCounter = 0;
  const findings = analyzeContent(content, filename);
  return { findings, summary: makeSummary(findings) };
}

export function reviewPullRequest(files: Array<{ filename: string; content: string; patch?: string }>): ReviewResult {
  findingCounter = 0;
  const allFindings: ReviewFinding[] = [];
  for (const file of files) {
    allFindings.push(...analyzeContent(file.content, file.filename));
  }
  return { findings: allFindings, summary: makeSummary(allFindings) };
}

export function reviewCommit(files: Array<{ filename: string; content: string }>): ReviewResult {
  findingCounter = 0;
  const allFindings: ReviewFinding[] = [];
  for (const file of files) {
    allFindings.push(...analyzeContent(file.content, file.filename));
  }
  return { findings: allFindings, summary: makeSummary(allFindings) };
}
