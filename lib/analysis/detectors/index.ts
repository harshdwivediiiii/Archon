import { DetectedService, DetectedApi, DetectedDatabase, DetectedDependency, DetectedInfrastructure, DetectedModule } from "../types";
import { detectFrontend } from "./frontend";
import { detectBackend } from "./backend";
import { detectDatabases } from "./database";
import { detectDependencies } from "./dependencies";
import { detectInfrastructure } from "./infra";
import { detectApis } from "./api";

export interface DetectorResults {
  services: DetectedService[];
  apis: DetectedApi[];
  databases: DetectedDatabase[];
  dependencies: DetectedDependency[];
  infra: DetectedInfrastructure[];
  modules: DetectedModule[];
  events: DetectedModule[];
}

export function detectAll(
  filePath: string,
  content: string,
  services: DetectedService[],
  apis: DetectedApi[],
  databases: DetectedDatabase[],
  dependencies: DetectedDependency[],
  infra: DetectedInfrastructure[],
  modules: DetectedModule[]
): void {
  detectFrontend(filePath, content, services);
  detectBackend(filePath, content, services);

  const newDbs = detectDatabases(filePath, content, services);
  databases.push(...newDbs);

  const newDeps = detectDependencies(filePath, content);
  dependencies.push(...newDeps);

  const newInfra = detectInfrastructure(filePath, content);
  infra.push(...newInfra);

  for (const service of services) {
    const newApis = detectApis(filePath, content, service.name);
    apis.push(...newApis);
  }

  const newModules = detectModules(filePath, content);
  modules.push(...newModules);
}

function detectModules(filePath: string, content: string): DetectedModule[] {
  const modules: DetectedModule[] = [];
  const fileName = filePath.split("/").pop() || "";
  const ext = filePath.split(".").pop() || "";

  if (!["ts", "tsx", "js", "jsx", "py", "go", "rs", "java"].includes(ext)) return modules;

  const imports = extractImports(content);
  const exports = extractExports(content);

  if (imports.length > 0 || exports.length > 0) {
    modules.push({
      name: fileName.replace(/\.[^/.]+$/, ""),
      type: ext === "py" ? "python" : ext === "go" ? "go" : ext === "rs" ? "rust" : ext === "java" ? "java" : "esm",
      exports,
      imports,
      sourceFile: filePath,
    });
  }

  return modules;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /import\s+(?:\w+\s+from\s+)?['"](.+?)['"]/g,
    /require\(['"](.+?)['"]\)/g,
    /from\s+['"](.+?)['"]/g,
    /import\s+['"](.+?)['"]/g,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const imp = match[1];
      if (imp && !imp.startsWith(".")) {
        const rootPkg = imp.split("/")[0];
        if (rootPkg.startsWith("@")) {
          imports.push(`${rootPkg}/${imp.split("/")[1]}`);
        } else {
          imports.push(rootPkg);
        }
      }
    }
  }

  return [...new Set(imports)];
}

function extractExports(content: string): string[] {
  const exportsList: string[] = [];
  const patterns = [
    /export\s+(?:default\s+)?(?:function|const|class|interface|type|enum)\s+(\w+)/g,
    /export\s*{([^}]+)}/g,
    /module\.exports\s*=\s*{?([^}]+)/g,
    /def\s+(\w+)/g,
    /pub\s+fn\s+(\w+)/g,
    /pub\s+(struct|enum|trait|fn|mod)\s+(\w+)/g,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const exp = match[1] || match[2];
      if (exp) {
        const parts = exp.split(",").map((s) => s.trim()).filter(Boolean);
        exportsList.push(...parts);
      }
    }
  }

  return exportsList;
}
