import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, extname } from "path";
import { AnalyzedFile, CodebaseMapNode } from "./types";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "target",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "env",
  ".tox",
  "coverage",
  ".nyc_output",
  "bower_components",
  ".gradle",
  "idea",
  ".vscode",
  ".DS_Store",
]);

const IGNORED_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
  ".gitignore",
  ".gitkeep",
  "yarn.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  ".npmrc",
  ".yarnrc",
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_TOTAL_FILES = 5000;

const LANGUAGE_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".py": "python",
  ".rb": "ruby",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".kt": "kotlin",
  ".swift": "swift",
  ".php": "php",
  ".cs": "csharp",
  ".cpp": "cpp",
  ".c": "c",
  ".h": "c",
  ".hpp": "cpp",
  ".scala": "scala",
  ".vue": "vue",
  ".svelte": "svelte",
  ".css": "css",
  ".scss": "scss",
  ".less": "less",
  ".html": "html",
  ".yml": "yaml",
  ".yaml": "yaml",
  ".json": "json",
  ".toml": "toml",
  ".tf": "terraform",
  ".md": "markdown",
  ".sql": "sql",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".prisma": "prisma",
  ".proto": "protobuf",
  ".sh": "shell",
  ".dockerfile": "dockerfile",
  "Dockerfile": "dockerfile",
};

export interface WalkResult {
  files: AnalyzedFile[];
  codebaseMap: CodebaseMapNode;
  fileContents: Map<string, string>;
}

export function walkDirectory(basePath: string): WalkResult {
  const files: AnalyzedFile[] = [];
  const fileContents = new Map<string, string>();
  const totalFiles = { count: 0 };

  const rootNode = buildCodebaseMap(basePath, basePath, files, fileContents, totalFiles);

  return { files, codebaseMap: rootNode, fileContents };
}

function buildCodebaseMap(
  basePath: string,
  currentPath: string,
  files: AnalyzedFile[],
  fileContents: Map<string, string>,
  totalFiles: { count: number }
): CodebaseMapNode {
  const relPath = relative(basePath, currentPath) || "";
  const name = currentPath.split("/").pop() || basePath.split("/").pop() || "";

  if (!existsSync(currentPath)) {
    return { name, type: "directory", path: relPath, children: [] };
  }

  const stat = statSync(currentPath);

  if (stat.isFile()) {
    const ext = extname(currentPath).toLowerCase();
    const fileName = currentPath.split("/").pop() || "";

    if (totalFiles.count >= MAX_TOTAL_FILES || IGNORED_FILES.has(fileName)) {
      return { name, type: "file", path: relPath, language: ext || "bin", size: stat.size };
    }

    const language = LANGUAGE_MAP[ext] || LANGUAGE_MAP[fileName] || ext || "unknown";

    if (stat.size > 0 && stat.size <= MAX_FILE_SIZE) {
      try {
        const content = readFileSync(currentPath, "utf-8");
        fileContents.set(relPath, content);
        totalFiles.count++;

        files.push({
          path: relPath,
          language,
          size: stat.size,
          lines: content.split("\n").length,
        });
      } catch {
        // Binary or unreadable file, skip
      }
    }

    return {
      name,
      type: "file",
      path: relPath,
      language,
      size: stat.size,
    };
  }

  if (stat.isDirectory()) {
    if (IGNORED_DIRS.has(name) && currentPath !== basePath) {
      return { name, type: "directory", path: relPath, children: [] };
    }

    let entries: string[];
    try {
      entries = readdirSync(currentPath);
    } catch {
      return { name, type: "directory", path: relPath, children: [] };
    }

    const children: CodebaseMapNode[] = [];
    for (const entry of entries) {
      const childPath = join(currentPath, entry);
      if (existsSync(childPath)) {
        const childNode = buildCodebaseMap(basePath, childPath, files, fileContents, totalFiles);
        children.push(childNode);
      }
    }

    return { name, type: "directory", path: relPath, children };
  }

  return { name, type: "directory", path: relPath, children: [] };
}
