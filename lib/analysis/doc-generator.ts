import { AnalysisResult, DetectedService, DetectedApi, DetectedDatabase } from "./types";

export function generateDocumentation(result: AnalysisResult): string {
  const sections: string[] = [];

  sections.push(generateOverview(result));
  sections.push(generateServiceDocs(result.services));
  sections.push(generateApiDocs(result.apis));
  sections.push(generateDatabaseDocs(result.databases));
  sections.push(generateDependencyDocs(result));
  sections.push(generateInfrastructureDocs(result));

  return sections.join("\n\n---\n\n");
}

function generateOverview(result: AnalysisResult): string {
  const serviceCount = result.services.length;
  const apiCount = result.apis.length;
  const dbCount = result.databases.length;
  const fileCount = result.files.length;

  return `## Architecture Overview

**Repository Analysis Summary:**

- **Total Files Analyzed:** ${fileCount}
- **Services Detected:** ${serviceCount}
- **API Endpoints Found:** ${apiCount}
- **Databases Connected:** ${dbCount}
- **Infrastructure Resources:** ${result.infra.length}

**Technology Stack:**
${result.services.map((s) => `- ${s.technology}: ${s.name} (${s.type})`).join("\n")}

**Database Technologies:**
${[...new Set(result.databases.map((d) => d.type))].map((t) => `- ${t}`).join("\n")}

**Infrastructure:**
${result.infra.map((i) => `- ${i.type}: ${i.name}`).join("\n")}
`;
}

function generateServiceDocs(services: DetectedService[]): string {
  if (services.length === 0) return "## Services\n\nNo services detected.";

  return `## Services

${services.map((service) => `### ${service.name}

- **Type:** ${service.type}
- **Technology:** ${service.technology}${service.port ? `\n- **Port:** ${service.port}` : ""}
- **Source Path:** \`${service.sourcePath}\`
- **Description:** ${service.description}
- **API Endpoints:** ${service.apis.length}
- **Database Connections:** ${service.databases.length > 0 ? service.databases.join(", ") : "None"}
- **Environment Variables:** ${service.envVars.length > 0 ? service.envVars.join(", ") : "None"}`).join("\n\n")}
`;
}

function generateApiDocs(apis: DetectedApi[]): string {
  if (apis.length === 0) return "## API Endpoints\n\nNo API endpoints detected.";

  const grouped = new Map<string, DetectedApi[]>();
  for (const api of apis) {
    if (!grouped.has(api.serviceName)) grouped.set(api.serviceName, []);
    grouped.get(api.serviceName)!.push(api);
  }

  return `## API Endpoints

${[...grouped.entries()].map(([service, apis]) => `### ${service}

| Method | Path | Auth | Type |
|--------|------|------|------|
${apis.map((api) => `| ${api.method} | \`${api.path}\` | ${api.auth ? "✓" : "✗"} | ${api.type} |`).join("\n")}`).join("\n\n")}
`;
}

function generateDatabaseDocs(databases: DetectedDatabase[]): string {
  if (databases.length === 0) return "## Databases\n\nNo databases detected.";

  return `## Databases

| Type | Name | Host | Port | Connected To |
|------|------|------|------|-------------|
${databases.map((db) => `| ${db.type} | ${db.name || "-"} | ${db.host || "-"} | ${db.port || "-"} | ${db.serviceName} |`).join("\n")}
`;
}

function generateDependencyDocs(result: AnalysisResult): string {
  const groupedDeps = new Map<string, number>();
  for (const dep of result.dependencies) {
    groupedDeps.set(dep.name, (groupedDeps.get(dep.name) || 0) + 1);
  }

  if (groupedDeps.size === 0) return "## Dependencies\n\nNo dependencies detected.";

  return `## Dependencies

Total unique dependencies: ${groupedDeps.size}

| Package | Usage Count |
|---------|------------|
${[...groupedDeps.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => `| ${name} | ${count} |`).join("\n")}
`;
}

function generateInfrastructureDocs(result: AnalysisResult): string {
  if (result.infra.length === 0) return "## Infrastructure\n\nNo infrastructure detected.";

  const docker = result.infra.filter((i) => i.type === "docker");
  const k8s = result.infra.filter((i) => i.type === "kubernetes");
  const tf = result.infra.filter((i) => i.type === "terraform");
  const ci = result.infra.filter((i) => i.type === "ci-cd");
  const cloud = result.infra.filter((i) => i.type === "cloud");

  return `## Infrastructure

${docker.length > 0 ? `### Docker
${docker.map((d) => `- \`${d.name}\``).join("\n")}` : ""}

${k8s.length > 0 ? `### Kubernetes
${k8s.map((k) => `- ${k.name}`).join("\n")}` : ""}

${tf.length > 0 ? `### Terraform
${tf.map((t) => `- ${t.name}`).join("\n")}` : ""}

${ci.length > 0 ? `### CI/CD
${ci.map((c) => `- ${c.name}`).join("\n")}` : ""}

${cloud.length > 0 ? `### Cloud Providers
${[...new Set(cloud.map((c) => c.name))].join(", ")}` : ""}
`;
}
