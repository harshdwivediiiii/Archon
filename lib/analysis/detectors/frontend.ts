import { DetectedService, DetectedApi } from "../types";

const FRAMEWORK_PATTERNS: Record<string, RegExp[]> = {
  "Next.js": [
    /"next":/,
    /from ['"]next['"]/,
    /require\(['"]next['"]\)/,
  ],
  React: [
    /"react":/,
    /from ['"]react['"]/,
    /import React/,
    /require\(['"]react['"]\)/,
  ],
  Vue: [
    /"vue":/,
    /from ['"]vue['"]/,
    /createApp\(/,
    /\.vue['"]/,
  ],
  Angular: [
    /@angular\/core/,
    /@Component\(/,
    /NgModule\(/,
    /angular\.json/,
  ],
  Svelte: [
    /"svelte":/,
    /\.svelte['"]/,
    /from ['"]svelte['"]/,
  ],
  Vite: [
    /"vite":/,
    /vite\.config/,
  ],
};

const API_ROUTE_PATTERNS = [
  /app\.(get|post|put|delete|patch)\(['"](.+?)['"]/g,
  /router\.(get|post|put|delete|patch)\(['"](.+?)['"]/g,
  /Route::(get|post|put|delete|patch)\(['"](.+?)['"]/g,
  /@(Get|Post|Put|Delete|Patch)\(['"](.+?)['"]/g,
];

export function detectFrontend(
  filePath: string,
  content: string,
  services: DetectedService[]
): void {
  const fileName = filePath.split("/").pop() || "";
  const isConfig = ["package.json", "angular.json", "vite.config.ts", "vite.config.js", "next.config.ts", "next.config.js", "svelte.config.js"].includes(fileName);
  const isComponent = /\.(tsx|jsx|vue|svelte)$/.test(filePath);
  const isPage = filePath.includes("/pages/") || filePath.includes("/app/");

  if (!isConfig && !isComponent && !isPage) return;

  let detectedFramework: string | null = null;

  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        detectedFramework = framework;
        break;
      }
    }
    if (detectedFramework) break;
  }

  if (detectedFramework && isConfig) {
    const existing = services.find(
      (s) => s.technology === detectedFramework && s.type === "frontend"
    );
    if (!existing) {
      const serviceName = fileName === "package.json"
        ? extractPackageName(content) || "frontend-app"
        : `${detectedFramework.toLowerCase().replace(/[^a-z0-9]/g, "-")}-app`;
      services.push({
        name: serviceName,
        type: "frontend",
        technology: detectedFramework,
        description: `${detectedFramework} Frontend Application`,
        sourcePath: filePath,
        apis: extractApiRoutes(content, serviceName),
        databases: [],
        dependencies: [],
        envVars: extractEnvVars(content),
      });
    }
  }

  if (isComponent && detectedFramework) {
    const existing = services.find(
      (s) => s.technology === detectedFramework && s.type === "frontend"
    );
    if (existing) {
      existing.sourcePath = filePath;
      existing.apis.push(...extractApiRoutes(content, existing.name));
    }
  }
}

function extractPackageName(content: string): string | null {
  try {
    const pkg = JSON.parse(content);
    return pkg.name || null;
  } catch {
    return null;
  }
}

function extractApiRoutes(content: string, serviceName: string): DetectedApi[] {
  const apis: DetectedApi[] = [];
  for (const pattern of API_ROUTE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      apis.push({
        method: match[1].toUpperCase(),
        path: match[2],
        serviceName,
        auth: content.includes("authenticate") || content.includes("auth") || content.includes("middleware"),
        type: "rest",
        sourceFile: "",
      });
    }
  }
  return apis;
}

function extractEnvVars(content: string): string[] {
  const envVars: string[] = [];
  const patterns = [
    /process\.env\.(\w+)/g,
    /import\.meta\.env\.(\w+)/g,
    /env\(['"](.+?)['"]\)/g,
  ];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (!envVars.includes(match[1])) {
        envVars.push(match[1]);
      }
    }
  }
  return envVars;
}
