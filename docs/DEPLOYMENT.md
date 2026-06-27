# Deployment Guide

## Prerequisites

- **Node.js** >= 20.x
- **PostgreSQL** >= 15 (Supabase or self-hosted)
- **Docker** (for local Compose development)
- **kubectl** (optional, for Kubernetes features)
- **OpenAI API key** (optional, for AI features)

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone <repo-url>
cd archon
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL, AUTH_SECRET, etc.

# 3. Generate Prisma client and push schema
npm run db:generate
npm run db:push

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

## Environment Configuration

**Source**: `lib/env.ts` — Zod-validated environment schema.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (must be valid URL, no placeholders) | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | Random 32+ char string for NextAuth | `openssl rand -base64 32` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUTH_GITHUB_ID` | GitHub OAuth App ID | — |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Secret | — |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | — |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | — |
| `OPENAI_API_KEY` | OpenAI API key for AI features | — |
| `OPENAI_MODEL` | AI model selection | `gpt-4o-mini` |
| `STRIPE_SECRET_KEY` | Stripe payments | — |
| `RESEND_API_KEY` | Email service (Resend) | — |
| `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics (PostHog) | — |
| `SENTRY_DSN` | Error tracking (Sentry) | — |
| `NEXT_PUBLIC_APP_URL` | Public app URL | — |
| `DIRECT_DATABASE_URL` | Direct (non-pooled) DB URL for migrations | Same as DATABASE_URL |
| `STORAGE_PATH` | Local file storage path | — |

### Validation

The `getEnv()` function validates all environment variables at runtime using Zod schemas. It detects:
- Placeholder passwords (`YOUR-PASSWORD`, `change-me`, `placeholder`)
- Invalid URLs
- Missing required fields
- Too-short auth secrets

## Docker Compose (Local)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/archon
      - AUTH_SECRET=your-secret-here
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: archon
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker compose up --build
```

## Kubernetes Deployment

**Source**: `k8s/`

The `k8s/` directory contains manifests for deploying Archon on Kubernetes:

```text
k8s/
├── namespace.yaml
├── archon-deployment.yaml
├── archon-service.yaml
└── README.md
```

### Deploy

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/archon-deployment.yaml
kubectl apply -f k8s/archon-service.yaml

# Check status
kubectl -n archon get all
```

The deployment requires the same environment variables configured via Kubernetes Secrets or an external secrets manager.

## Database Setup

Archon uses **Prisma** with PostgreSQL (via Supabase in production).

### Schema Management

```bash
# Development - create migration
npm run db:migrate

# Production - apply migrations
npm run db:deploy

# Check migration status
npm run db:status

# Open Prisma Studio
npm run db:studio
```

**Source**: `prisma/` — Prisma schema, migrations.

## Authentication Setup

**Source**: `lib/auth/auth.config.ts`, `lib/auth/auth.ts`

### GitHub OAuth

1. Create a GitHub OAuth App at Settings → Developer settings → OAuth Apps
2. Set callback URL to `http://localhost:3000/api/auth/callback/github`
3. Set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in environment

### Google OAuth

1. Create credentials at Google Cloud Console → APIs & Services → Credentials
2. Set authorized redirect URI to `http://localhost:3000/api/auth/callback/google`
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in environment

### Auth Verification

```bash
curl http://localhost:3000/api/auth/session
# → null (unauthenticated) or { user: {...}, expires: "..." }
```

## Monitoring and Observability

**Source**: `lib/observability/index.ts`

Archon supports:
- **PostHog** for product analytics (`NEXT_PUBLIC_POSTHOG_KEY`)
- **Sentry** for error tracking (`SENTRY_DSN`)
- Health check endpoints at `/api/health` and `/api/healthz`

### Build

```bash
npm run build
```

Produces an optimized production build in `.next/`.

### Production Start

```bash
npm start  # or: node .next/standalone/server.js
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `DATABASE_URL contains a placeholder password` | `.env.local` has placeholder values | Edit `.env.local` with real credentials |
| `Auth not configured` | Missing OAuth env vars | Set `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` or see startup logs |
| `kubectl not found in PATH` | kubectl not installed | `brew install kubectl` or `snap install kubectl` |
| AI features not working | Missing `OPENAI_API_KEY` | Set the key or AI features gracefully degrade |
| Prisma Client errors | Schema out of sync | Run `npm run db:generate` after pulling new migrations |

### Debug Logs

The auth module logs configuration status on startup:
```
[auth] Environment: development
[auth] AUTH_SECRET set: true
[auth] Google configured: true
[auth] GitHub configured: false
```
