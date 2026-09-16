# Backend Dockerfile (Production Optimized)
FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV HTTP_PROXY= \
    HTTPS_PROXY= \
    http_proxy= \
    https_proxy=

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# The locked Nest 10 dependency graph contains a legacy peer declaration in
# @nestjs/serve-static; use the lockfile's resolved graph without changing
# package manifests during container preparation.
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .

RUN npx prisma generate
# Bound the compiler heap for small VM/CI builders; runtime memory remains
# governed by the container platform rather than this build-only setting.
RUN NODE_OPTIONS=--max-old-space-size=1024 npm run build

# Production Image
FROM node:24-bookworm-slim

LABEL org.opencontainers.image.nexi-runtime="20260828-start-env-v2"

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma/d1-client ./dist/src/prisma/d1-client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# Schema changes are a separately reviewed migration concern. Container
# startup must be restart-safe; D1 schema mutation is an explicit migration operation, never an application-startup side effect.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/ops/live').then(r=>{if(!r.ok) process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
