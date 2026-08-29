# NEXI Cloudflare Staging Secret Mapping

This contract contains names only. Secret values must be supplied through the
approved Cloudflare staging workflow and must never be committed.

## Container runtime secrets

| Secret | Consumer | Contract |
|---|---|---|
| `DATABASE_URL` | NestJS PrismaService | Neon pooled application endpoint |
| `REDIS_URL` | NestJS Redis services | External Redis endpoint |
| `JWT_SECRET` | Auth/session services | Staging-only secret |
| `CORS_ORIGINS` | Runtime configuration | Explicit staging frontend origins |

## Migration-only secret

| Secret | Consumer | Contract |
|---|---|---|
| `DIRECT_URL` | Prisma CLI / migration job | Neon direct non-pooled endpoint; do not inject into the application container unless a separately approved migration workflow requires it |

## Deliberate boundaries

- The Worker remains an edge transport layer.
- PostgreSQL/Neon remains durable authority.
- Redis remains external and ephemeral.
- R2 remains private object storage for approved evidence objects.
- Provider credentials are added only when the provider is explicitly enabled.
- No values, passwords, tokens, or connection strings are stored here.
