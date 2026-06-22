import { DetectedService, DetectedApi } from "../types";

const BACKEND_PATTERNS: Record<string, RegExp[]> = {
  Express: [
    /require\(['"]express['"]\)/,
    /from ['"]express['"]/,
    /express\(\)/,
  ],
  "NestJS": [
    /@nestjs\//,
    /@Module\(/,
    /@Controller\(/,
    /NestFactory\.create/,
  ],
  Fastify: [
    /require\(['"]fastify['"]\)/,
    /from ['"]fastify['"]/,
    /fastify\(/,
  ],
  "Spring Boot": [
    /@SpringBootApplication/,
    /@RestController/,
    /@RequestMapping/,
    /spring-boot/,
  ],
  Django: [
    /django/,
    /from django/,
    /urlpatterns/,
    /wsgi\.application/,
  ],
  Flask: [
    /from flask/,
    /Flask\(__name__\)/,
    /@app\.route/,
  ],
  "FastAPI": [
    /from fastapi/,
    /FastAPI\(\)/,
    /@app\.(get|post|put|delete)/,
  ],
  Rails: [
    /Rails\.application/,
    /gem ['"]rails['"]/,
    /config\/routes\.rb/,
  ],
  Laravel: [
    /laravel/,
    /artisan/,
    /Route::/,
  ],
  "Node.js": [
    /require\(['"]http['"]\)/,
    /require\(['"]https['"]\)/,
    /createServer\(/,
    /"node":/,
  ],
};

const SERVER_PORT_PATTERNS = [
  /port\s*[:=]\s*(\d{4,5})/,
  /PORT\s*=\s*['"]?(\d{4,5})['"]?/,
  /listen\((\d{4,5})\)/,
  /port["']?\s*:\s*(\d{4,5})/,
];

export function detectBackend(
  filePath: string,
  content: string,
  services: DetectedService[]
): void {
  const fileName = filePath.split("/").pop() || "";
  const isConfig = ["package.json", "requirements.txt", "Gemfile", "Cargo.toml", "build.gradle", "pom.xml"].includes(fileName);
  const isSource = /\.(ts|js|py|rb|java|kt|go|rs)$/.test(filePath);

  if (!isConfig && !isSource) return;

  let detectedBackend: string | null = null;

  for (const [backend, patterns] of Object.entries(BACKEND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        detectedBackend = backend;
        break;
      }
    }
    if (detectedBackend) break;
  }

  if (!detectedBackend && isConfig) {
    if (content.includes('"express"') || content.includes("'express'")) {
      detectedBackend = "Express";
    } else if (content.includes("django") || content.includes("Django")) {
      detectedBackend = "Django";
    } else if (content.includes("flask") || content.includes("Flask")) {
      detectedBackend = "Flask";
    } else if (content.includes("fastapi") || content.includes("FastAPI")) {
      detectedBackend = "FastAPI";
    }
  }

  if (detectedBackend) {
    let port: number | undefined;
    for (const pattern of SERVER_PORT_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        port = parseInt(match[1], 10);
        break;
      }
    }

    const existing = services.find(
      (s) => s.technology === detectedBackend && s.type === "backend"
    );

    const serviceName = fileName === "package.json"
      ? extractPackageName(content) || `${detectedBackend.toLowerCase().replace(/[^a-z0-9]/g, "-")}-api`
      : `${detectedBackend.toLowerCase().replace(/[^a-z0-9]/g, "-")}-api`;

    if (!existing) {
      services.push({
        name: serviceName,
        type: "backend",
        technology: detectedBackend,
        description: `${detectedBackend} Backend Service`,
        sourcePath: filePath,
        port,
        apis: extractRoutes(content, serviceName),
        databases: [],
        dependencies: [],
        envVars: extractEnvVars(content),
      });
    } else {
      existing.port = existing.port || port;
      existing.sourcePath = filePath;
      existing.apis.push(...extractRoutes(content, existing.name));
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

function extractRoutes(content: string, serviceName: string): DetectedApi[] {
  const apis: DetectedApi[] = [];
  const patterns = [
    { regex: /router\.(get|post|put|delete|patch)\(['"](.+?)['"]/g, type: "rest" as const },
    { regex: /app\.(get|post|put|delete|patch)\(['"](.+?)['"]/g, type: "rest" as const },
    { regex: /@app\.(get|post|put|delete)\(['"](.+?)['"]/g, type: "rest" as const },
    { regex: /@(Get|Post|Put|Delete|Patch)\(['"](.+?)['"]/g, type: "rest" as const },
    { regex: /\.route\(['"](.+?)['"]\)/g, type: "rest" as const },
    { regex: /addRoute\(['"](.+?)['"]/g, type: "rest" as const },
  ];

  for (const { regex, type } of patterns) {
    const matches = content.matchAll(regex);
    for (const match of matches) {
      const method = match[1]?.toUpperCase() || "GET";
      const path = match[2] || match[1] || "/";
      apis.push({
        method,
        path,
        serviceName,
        auth: content.includes("authenticate") || content.includes("auth") || content.includes("middleware"),
        type,
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
    /os\.environ\.get\(['"](.+?)['"]\)/g,
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
