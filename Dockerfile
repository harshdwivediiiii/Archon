FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

FROM node:22-bookworm-slim AS builder

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY scripts/validate-env.js ./validate-env.js
COPY scripts/entrypoint.sh ./entrypoint.sh

RUN mkdir -p /tmp/.next/cache /app/.next/standalone/archon/storage/uploads /app/storage/uploads && chown -R nextjs:nodejs /tmp /app/.next/standalone/archon/storage /app/storage

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
