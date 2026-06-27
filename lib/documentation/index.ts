import { createChatStream } from "@/lib/ai/chat";

export const DOC_TYPES = [
  "README",
  "API_DOCUMENTATION",
  "ARCHITECTURE",
  "DATABASE",
  "COMPONENT",
  "DEPLOYMENT_GUIDE",
  "CONTRIBUTING_GUIDE",
  "RELEASE_NOTES",
  "CHANGELOG",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export interface DocSection {
  title: string;
  content: string;
  level: number;
}

export interface GeneratedDoc {
  type: DocType;
  title: string;
  sections: DocSection[];
  raw: string;
  metadata: {
    generatedAt: string;
    context: string;
    repositoryInfo?: string;
  };
}

const DOC_PROMPTS: Record<DocType, string> = {
  README: `Generate a comprehensive README.md for the repository/project described below.
Include: project title, description, table of contents, installation instructions, usage examples, configuration, API reference, contributing guidelines, license.
Use proper markdown formatting with headings, code blocks, tables, and lists.`,

  API_DOCUMENTATION: `Generate detailed API documentation for the project described below.
Include: endpoint descriptions, request/response schemas, authentication, error codes, rate limiting, examples for each endpoint.
Format as structured markdown with HTTP methods, paths, parameters, and response examples.`,

  ARCHITECTURE: `Generate an architecture decision record and system design document.
Include: high-level architecture overview, system components, data flow, technology stack decisions, scalability considerations, trade-offs.
Use mermaid diagrams and clear markdown structure.`,

  DATABASE: `Generate database documentation including schema documentation.
Include: entity relationship overview, table descriptions, column details, indexes, relationships, migration strategy, query patterns, and performance considerations.
Format with markdown tables and descriptions.`,

  COMPONENT: `Generate component documentation for the project.
Include: component tree, component API/props, usage examples, styling approach, state management, accessibility notes, testing strategy.
Format with clear headings and code examples.`,

  DEPLOYMENT_GUIDE: `Generate a deployment guide.
Include: prerequisites, environment setup, build process, deployment steps for different environments, CI/CD pipeline configuration, rollback strategy, monitoring setup.
Format as step-by-step markdown.`,

  CONTRIBUTING_GUIDE: `Generate a contributing guide.
Include: code of conduct, development setup, branch strategy, commit conventions, PR process, coding standards, testing requirements, review process.
Format as clear markdown with checklists and guidelines.`,

  RELEASE_NOTES: `Generate release notes for the project.
Include: version, release date, new features, improvements, bug fixes, breaking changes, deprecations, known issues, upgrade instructions.
Format as structured markdown.`,

  CHANGELOG: `Generate a changelog following keepachangelog format.
Include: entries for unreleased changes, versions with dates for added, changed, deprecated, removed, fixed, security sections.
Format using proper markdown headings and lists.`,
};

const DOC_TITLES: Record<DocType, string> = {
  README: "README.md",
  API_DOCUMENTATION: "API Documentation",
  ARCHITECTURE: "Architecture Documentation",
  DATABASE: "Database Documentation",
  COMPONENT: "Component Documentation",
  DEPLOYMENT_GUIDE: "Deployment Guide",
  CONTRIBUTING_GUIDE: "Contributing Guide",
  RELEASE_NOTES: "Release Notes",
  CHANGELOG: "Changelog",
};

function buildPrompt(
  type: DocType,
  context: string,
  repositoryInfo?: string
): string {
  const prompt = DOC_PROMPTS[type];
  const repoSection = repositoryInfo
    ? `\n\nRepository Information:\n${repositoryInfo}`
    : "";
  return `${prompt}\n\nContext:\n${context}${repoSection}\n\nGenerate the documentation in markdown format. Use proper headings, code blocks, tables, and lists.`;
}

function parseSections(raw: string): DocSection[] {
  const sections: DocSection[] = [];
  const lines = raw.split("\n");
  let currentTitle = "Overview";
  let currentContent: string[] = [];
  let currentLevel = 1;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
          level: currentLevel,
        });
      }
      currentLevel = headingMatch[1].length;
      currentTitle = headingMatch[2];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
      level: currentLevel,
    });
  }

  return sections;
}

export async function generateDocumentation(
  type: DocType,
  context: string,
  repositoryInfo?: string
): Promise<GeneratedDoc> {
  const prompt = buildPrompt(type, context, repositoryInfo);

  const stream = await createChatStream([
    { role: "user", content: prompt },
  ]);

  let raw = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    raw += content;
  }

  const sections = parseSections(raw);

  return {
    type,
    title: DOC_TITLES[type],
    sections,
    raw,
    metadata: {
      generatedAt: new Date().toISOString(),
      context,
      repositoryInfo,
    },
  };
}

export async function generateReadme(
  context: string,
  repositoryInfo?: string
): Promise<GeneratedDoc> {
  return generateDocumentation("README", context, repositoryInfo);
}

export async function generateApiDocs(
  context: string,
  repositoryInfo?: string
): Promise<GeneratedDoc> {
  return generateDocumentation("API_DOCUMENTATION", context, repositoryInfo);
}

export async function generateArchDocs(
  context: string,
  repositoryInfo?: string
): Promise<GeneratedDoc> {
  return generateDocumentation("ARCHITECTURE", context, repositoryInfo);
}

export function formatDocumentation(doc: GeneratedDoc): string {
  const lines: string[] = [
    `# ${doc.title}`,
    "",
    `> Generated: ${new Date(doc.metadata.generatedAt).toLocaleString()}`,
    `> Type: ${doc.type.replace(/_/g, " ").toLowerCase()}`,
    "",
    "---",
    "",
  ];

  for (const section of doc.sections) {
    lines.push(`${"#".repeat(section.level)} ${section.title}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  }

  return lines.join("\n");
}

export function getDocTypeLabel(type: DocType): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDocTypes(): DocType[] {
  return [...DOC_TYPES];
}
