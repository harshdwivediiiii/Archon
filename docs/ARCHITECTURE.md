# Archon System Architecture

## High-Level Overview

Archon is a Next.js 16 platform built on the App Router that provides a unified DevOps, AI-powered code analysis, and infrastructure management dashboard. It combines Kubernetes cluster management, Docker container orchestration, repository analysis, security scanning, and AI-assisted development workflows into a single web application.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Next.js App)                       │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐  │
│  │K8s Dash │ │Docker    │ │Security   │ │AI Chat   │ │DevTools │  │
│  │Dashboard│ │Manager   │ │Center     │ │Assistant │ │Playground│  │
│  └────┬────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬────┘  │
│       │           │             │            │             │       │
│  ┌────┴───────────┴─────────────┴────────────┴─────────────┴────┐  │
│  │                    Next.js API Routes (/app/api/*)            │  │
│  └────┬───────────┬─────────────┬────────────┬─────────────┬────┘  │
└───────┼───────────┼─────────────┼────────────┼─────────────┼───────┘
        │           │             │            │             │
   ┌────┴────┐ ┌────┴────┐  ┌────┴─────┐ ┌───┴────┐  ┌─────┴─────┐
   │ kubectl │ │ docker  │  │  Prisma   │ │ OpenAI │  │    Git    │
   │   CLI   │ │  CLI    │  │  (Postgres)│ │  API   │  │ (simple-git)
   └─────────┘ └─────────┘  └──────────┘ └────────┘  └───────────┘
```

## Module Relationships and Dependencies

```
lib/
├── kubernetes/client.ts    ─── kubectl CLI wrapper
├── docker/client.ts        ─── docker CLI wrapper
├── security/index.ts       ─── Dependency scanning, secret detection, OWASP, licensing
├── ai/
│   ├── chat.ts             ─── Streaming chat with OpenAI
│   ├── openai.ts           ─── OpenAI client singleton
│   ├── architecture-analyzer.ts ─── AI architecture analysis
│   └── repository-analysis.ts   ─── Repository analysis via AI
├── analysis/
│   ├── index.ts            ─── Orchestrates full analysis pipeline
│   ├── ast-parser.ts       ─── Multi-language AST parsing (TS/JS, Python, Go, Rust, Java)
│   ├── file-walker.ts      ─── Recursive directory walker
│   ├── detectors/          ─── Pattern-based service/API/database/infra detection
│   ├── graph-builder.ts    ─── Knowledge graph construction
│   ├── diagram-generator.ts ─── React Flow diagram generation
│   ├── doc-generator.ts    ─── Static architecture documentation
│   └── security.ts         ─── Code-level secret scanning
├── auth/
│   ├── auth.config.ts      ─── Auth.js config (GitHub, Google providers)
│   └── auth.ts             ─── NextAuth initialization with Prisma adapter
├── codereview/index.ts     ─── Pattern-based + AI code review engine
├── devtools/index.ts       ─── Regex tester, JSON/YAML formatter, Base64, JWT, UUID, Hash, Cron, SQL
├── semantic-search/index.ts ─── TF-IDF-style code search
├── documentation/index.ts  ─── AI-powered documentation generator
├── env.ts                  ─── Zod-validated environment configuration
├── analytics/index.ts      ─── Analytics service
├── observability/index.ts  ─── Observability service
├── notifications/index.ts  ─── Notification service
├── storage/                ─── Local file storage provider
└── db/                     ─── Prisma database client
```

## Data Flow: Analysis Pipeline

```
Repository URL
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Clone    │────▶│ 2. Walk Files │────▶│ 3. Detect    │
│ (simple-git)│     │ (file-walker)│     │ Services     │
└─────────────┘     └──────────────┘     │ APIs         │
                                         │ Databases    │
                                         │ Dependencies │
                                         │ Infra        │
                                         └──────┬───────┘
                                                │
                    ┌───────────────────────────┼───────────┐
                    │                           │           │
                    ▼                           ▼           ▼
           ┌──────────────┐           ┌──────────────┐
           │ 4. AST Parse │           │ 5. Build     │
           │ (ast-parser) │           │ Graph        │
           │ - Functions  │           │ (graph-builder)
           │ - Classes    │           │ - Nodes      │
           │ - Imports    │           │ - Edges      │
           │ - Decorators │           └──────┬───────┘
           └──────┬───────┘                  │
                  │                          ▼
                  ▼                 ┌──────────────────┐
           ┌──────────────┐         │ 6. AI Analysis   │
           │ Module       │         │ (architecture-   │
           │ Extraction   │         │  analyzer.ts)    │
           └──────────────┘         │ - Patterns       │
                                    │ - Recommendations│
                                    │ - Scalability    │
                                    └──────────────────┘
                                                │
                    ┌───────────────────────────┘
                    ▼
           ┌──────────────────┐      ┌──────────────────┐
           │ 7. Security     │      │ 8. Diagram + Doc │
           │ Scan (secrets)  │      │ Generation       │
           └──────────────────┘      └──────────────────┘
                                                │
                                                ▼
                                   ┌──────────────────────┐
                                   │ 9. Persist to        │
                                   │    Database (Prisma) │
                                   └──────────────────────┘
```

## Authentication Flow

```
User → Browser → NextAuth.js
                    │
        ┌───────────┼───────────┐
        │           │           │
    GitHub      Google     Credentials
    OAuth       OAuth      (future)
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
           ┌──────────────┐
           │ PrismaAdapter │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │  PostgreSQL   │
           │  (Supabase)   │
           └──────────────┘
```

- Configured via `lib/auth/auth.config.ts` with GitHub and Google OAuth providers
- Initialized in `lib/auth/auth.ts` with database session strategy
- Prisma adapter persists users, sessions, and accounts to PostgreSQL
- Graceful degradation when OAuth providers are not configured

## API Design Principles

- **Next.js App Router API routes** under `app/api/`
- Type-safe request/response validation using `zod` schemas
- Route organization mirrors the UI module structure: `kubernetes/`, `docker/`, `security/`, `ai/`, etc.
- Streaming responses for AI chat (`lib/ai/chat.ts`)
- JSON response format with proper error status codes
- Server-side authentication via `auth()` helper
- Graceful fallbacks when external services are unavailable

## State Management

Archon uses **zustand** for client-side state management and **Prisma** for persistent server-side state:

- **Client state**: UI preferences, active tabs, form state via zustand stores
- **Server state**: Repository analysis results, user data, projects persisted via Prisma to PostgreSQL
- **Real-time**: Kubernetes pod logs, Docker container stats, AI chat streaming via SSE-like patterns
- **Caching**: `getEnv()` uses module-level caching for validated environment variables

## Key Source Files

| Module | Source Path |
|--------|------------|
| Kubernetes client | `lib/kubernetes/client.ts` |
| Docker client | `lib/docker/client.ts` |
| Security scan | `lib/security/index.ts` |
| AI chat | `lib/ai/chat.ts` |
| Architecture analyzer | `lib/ai/architecture-analyzer.ts` |
| Code review | `lib/codereview/index.ts` |
| Semantic search | `lib/semantic-search/index.ts` |
| Documentation gen | `lib/documentation/index.ts` |
| Analysis pipeline | `lib/analysis/index.ts` |
| Auth config | `lib/auth/auth.config.ts` |
| Auth init | `lib/auth/auth.ts` |
| Env validation | `lib/env.ts` |
| Dev tools | `lib/devtools/index.ts` |
| Type definitions | `types/platform.ts` |
