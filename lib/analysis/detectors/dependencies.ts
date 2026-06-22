import { DetectedDependency } from "../types";

const LOCK_FILES: Record<string, (content: string) => DetectedDependency[]> = {
  "package.json": parsePackageJson,
  "requirements.txt": parseRequirementsTxt,
  "Gemfile": parseGemfile,
  "Gemfile.lock": parseGemfile,
  "Cargo.toml": parseCargoToml,
  "go.mod": parseGoMod,
  "build.gradle": parseGradle,
  "pom.xml": parsePomXml,
  "yarn.lock": () => [],
  "package-lock.json": () => [],
};

export function detectDependencies(
  filePath: string,
  content: string
): DetectedDependency[] {
  const fileName = filePath.split("/").pop() || "";

  const parser = LOCK_FILES[fileName];
  if (parser) {
    return parser(content);
  }

  return [];
}

function parsePackageJson(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  try {
    const pkg = JSON.parse(content);
    const allDeps: Record<string, { deps: Record<string, string>; type: DetectedDependency["type"] }> = {
      dependencies: { deps: pkg.dependencies || {}, type: "dependency" as const },
      devDependencies: { deps: pkg.devDependencies || {}, type: "devDependency" as const },
      peerDependencies: { deps: pkg.peerDependencies || {}, type: "peerDependency" as const },
    };

    for (const { deps: depMap, type } of Object.values(allDeps)) {
      for (const [name, version] of Object.entries(depMap)) {
        deps.push({
          name,
          version: version as string,
          type,
          sourceFile: "",
        });
      }
    }
  } catch {
    // Invalid JSON, skip
  }
  return deps;
}

function parseRequirementsTxt(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-r")) continue;
    const match = trimmed.match(/^([\w.-]+)([><=!~]=+\s*[\w.*-]+)?/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[2]?.replace(/^[><=!~]+/, "")?.trim() || "latest",
        type: "dependency",
        sourceFile: "requirements.txt",
      });
    }
  }
  return deps;
}

function parseGemfile(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/gem\s+['"]([\w-]+)['"]/);
    if (match) {
      const versionMatch = trimmed.match(/['"]\s*,\s*['"](.+?)['"]/);
      deps.push({
        name: match[1],
        version: versionMatch?.[1] || "latest",
        type: "dependency",
        sourceFile: "Gemfile",
      });
    }
  }
  return deps;
}

function parseCargoToml(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  const lines = content.split("\n");
  let inDeps = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[dependencies]")) {
      inDeps = true;
      continue;
    }
    if (trimmed.startsWith("[")) {
      inDeps = false;
      continue;
    }
    if (inDeps && trimmed) {
      const match = trimmed.match(/^(\w[\w-]*)\s*=\s*["{](.+?)["}]/);
      if (match) {
        deps.push({
          name: match[1],
          version: match[2].replace(/"/g, ""),
          type: "dependency",
          sourceFile: "Cargo.toml",
        });
      }
    }
  }
  return deps;
}

function parseGoMod(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  const lines = content.split("\n");
  let inRequire = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("require (")) {
      inRequire = true;
      continue;
    }
    if (trimmed === ")") {
      inRequire = false;
      continue;
    }
    if (inRequire || trimmed.startsWith("require ")) {
      const cleanLine = trimmed.replace(/^require\s+/, "");
      const match = cleanLine.match(/^(\S+)\s+(v\S+)/);
      if (match) {
        deps.push({
          name: match[1],
          version: match[2],
          type: "dependency",
          sourceFile: "go.mod",
        });
      }
    }
  }
  return deps;
}

function parseGradle(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  const patterns = [
    /implementation\s+['"](.+?):(.+?):(.+?)['"]/g,
    /api\s+['"](.+?):(.+?):(.+?)['"]/g,
    /compile\s+['"](.+?):(.+?):(.+?)['"]/g,
    /testImplementation\s+['"](.+?):(.+?):(.+?)['"]/g,
  ];

  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      deps.push({
        name: `${match[1]}:${match[2]}`,
        version: match[3],
        type: "dependency",
        sourceFile: "build.gradle",
      });
    }
  }
  return deps;
}

function parsePomXml(content: string): DetectedDependency[] {
  const deps: DetectedDependency[] = [];
  const artifactPattern = /<artifactId>(.+?)<\/artifactId>/g;
  const versionPattern = /<version>(.+?)<\/version>/g;
  const artifactMatches = [...content.matchAll(artifactPattern)];
  const versionMatches = [...content.matchAll(versionPattern)];

  const count = Math.min(artifactMatches.length, versionMatches.length);
  for (let i = 0; i < count; i++) {
    deps.push({
      name: artifactMatches[i][1],
      version: versionMatches[i][1],
      type: "dependency",
      sourceFile: "pom.xml",
    });
  }
  return deps;
}
