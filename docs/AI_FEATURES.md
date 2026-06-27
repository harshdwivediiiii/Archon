# AI-Powered Features

## Overview

Archon integrates OpenAI's GPT models across multiple modules to provide intelligent assistance for code analysis, documentation, architecture review, and repository understanding.

## AI Repository Chat with RAG

**Source**: `lib/ai/chat.ts`

Archon provides a streaming chat interface powered by OpenAI (`gpt-4o-mini` by default). The chat:
- Streams responses token-by-token for real-time UX
- Uses a system prompt tuned for architecture intelligence
- Configurable model via `OPENAI_MODEL` environment variable

```
User Message → createChatStream() → OpenAI API (stream) → Token chunks → UI
```

```typescript
// Basic usage
import { createChatStream } from "@/lib/ai/chat";

const stream = await createChatStream([
  { role: "user", content: "Explain this Kubernetes deployment..." },
]);

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || "";
  // Append to UI
}
```

## Semantic Code Search

**Source**: `lib/semantic-search/index.ts`

A TF-IDF-style search engine that scores code lines against a query:

- Tokenizes queries with stop-word filtering
- Scores matches by: exact phrase match, token presence, word boundaries, file type weighting
- Boosts definitions (function/class declarations) over imports/comments
- Supports file type filtering (`.ts`, `.py`, `.go`, etc.)
- Returns ranked results with surrounding context lines

```typescript
import { semanticSearch } from "@/lib/semantic-search";

const result = semanticSearch(
  { query: "database connection", fileType: "typescript", limit: 20 },
  files  // Array<{ path: string; content: string }>
);

result.matches.forEach(match => {
  console.log(`${match.file}:${match.line} (score: ${match.score})`);
  console.log(match.content);
});
```

**Source**: `lib/analysis/index.ts` — the analysis pipeline orchestrates the full workflow.

## AI Code Review

**Source**: `lib/codereview/index.ts` — 691 lines

Archon's code review engine combines **pattern-based analysis** with **AI enhancements**:

### Pattern-Based Detection

Pre-defined patterns across 8 categories:

| Category | Patterns | Examples |
|----------|----------|----------|
| **Bug** | 6 | Empty catch, assignment in condition, NaN comparison, loose equality, unhandled promises |
| **Security** | 5 | eval(), innerHTML, SQL injection, command injection, hardcoded secrets |
| **Performance** | 4 | Nested loops, large array spread, inefficient regex, unnecessary re-renders |
| **Readability** | 3 | Long functions, deep nesting, magic numbers |
| **Naming** | 3 | Single-letter vars, inconsistent casing, short parameter names |
| **Complexity** | 1 | Cyclomatic complexity > 10 branches |
| **Code Smell** | 4 | Commented code, TODO/FIXME, duplication, large files |
| **Suggestion** | 6 | Optional chaining, nullish coalescing, array methods, template literals, destructuring, async/await |

```typescript
import { reviewCode, reviewPullRequest } from "@/lib/codereview";

// Review a single file
const result = reviewCode(sourceCode, "app.ts", "typescript");
console.log(`Found ${result.summary.total} issues`);

// Review a PR
const prResult = reviewPullRequest([
  { filename: "src/api.ts", content: "..." },
  { filename: "src/utils.ts", content: "..." },
]);
```

## AI Documentation Generator

**Source**: `lib/documentation/index.ts` — 216 lines

Generates comprehensive documentation using AI prompts tailored to 9 document types:

| Type | Prompt Focus |
|------|-------------|
| `README` | Project title, description, install, usage, API, contributing, license |
| `API_DOCUMENTATION` | Endpoints, request/response schemas, auth, error codes, examples |
| `ARCHITECTURE` | System design, components, data flow, tech stack, trade-offs |
| `DATABASE` | Schema, tables, columns, indexes, relationships, migration strategy |
| `COMPONENT` | Component tree, props, usage examples, styling, accessibility |
| `DEPLOYMENT_GUIDE` | Prerequisites, build, deploy steps, CI/CD, rollback, monitoring |
| `CONTRIBUTING_GUIDE` | Setup, branch strategy, PR process, coding standards |
| `RELEASE_NOTES` | Version, features, fixes, breaking changes, upgrade instructions |
| `CHANGELOG` | Keep a Changelog format with version entries |

```typescript
import { generateDocumentation } from "@/lib/documentation";

const doc = await generateDocumentation(
  "README",
  "A Next.js app for managing Kubernetes clusters and Docker containers",
  "Repository: archon, Node.js, Next.js 16, Postgres, Prisma"
);
```

## Architecture Analysis

**Source**: `lib/ai/architecture-analyzer.ts` — 155 lines

The AI architecture analyzer takes static analysis results and enriches them:

```
Static Analysis (detectors + AST) → buildArchitectureContext() → OpenAI → Enriched Analysis
                                                                      │
                                                                      ▼
                                                        ┌─────────────────────┐
                                                        │ Pattern detection   │
                                                        │ Tech stack analysis │
                                                        │ Recommendations     │
                                                        │ Scalability assess  │
                                                        │ Complexity rating   │
                                                        └─────────────────────┘
```

```typescript
import { analyzeArchitecture } from "@/lib/ai/architecture-analyzer";

const analysis = await analyzeArchitecture(staticAnalysisResult);
// Returns: pattern, patterns[], summary, technologyStack[],
//          recommendations[], enrichedDescriptions, architectureStyle,
//          complexity, scalability
```

## OpenAI Configuration

**Source**: `lib/ai/openai.ts`

```env
OPENAI_API_KEY=sk-...    # Your OpenAI API key (optional)
OPENAI_MODEL=gpt-4o-mini # Model selection (optional, default: gpt-4o-mini)
```

The OpenAI client is initialized lazily as a singleton. Connection testing is available via `testOpenAIConnection()`.

## Prompt Engineering Guide

### Architecture Analysis Prompt

The system prompt instructs the model to act as an expert software architect. The context is built from all detected services, APIs, databases, dependencies, modules, events, and infrastructure — formatted as structured markdown sections.

### Documentation Prompts

Each `DocType` has a dedicated prompt template in `DOC_PROMPTS` that specifies:
- Required sections and formatting
- Markdown structure expectations (headings, code blocks, tables, lists)
- Type-specific content requirements

### Chat System Prompt

```
"You are Archon AI, an expert architecture intelligence assistant."
```

Best practices for custom prompts:
- **Be specific**: Include file paths, line numbers, and code snippets
- **Provide context**: Mention the technology stack and framework
- **Request format**: Ask for JSON, markdown, or bullet points explicitly
- **Use temperature**: Lower values (0.1-0.3) for deterministic analysis, higher for creative suggestions
