# NEXI G1 Contract Spine — Current Source Receipt

Source: `main` at `bba361774874c2eafb625013677f0b8fad3d301d`
Evidence: direct current source, Graphify topology, focused tests. This is not runtime proof.

| Feature family | Public/Admin entry | Backend authority | Durable path | Current status | Next proof |
|---|---|---|---|---|---|
| Market / quotes | `useMarketData.ts`, `/api/market/{prices,klines}` | `market-kline.controller.ts`, market services | D1 market read/write; provider hydration | C0 build + market adapter tests pass; prices/depth/trades require full route audit | C1/C2 real client → Nest → D1 |
| Asset detail | dashboard asset route; market hooks | market controllers/services | D1 market catalog/read model | Source route present; complete depth/trade contract not yet closed | C2 asset read + stale/unavailable cases |
| Spot | dashboard/spot; spot API client | `spot.controller.ts`, `spot.service.ts` | Prisma-backed legacy path plus ledger; D1 integration requires verification | Contract present; authority boundary unresolved | Verify D1 command path and idempotency |
| Isolated margin | spot margin client | `spot/margin.controller.ts` and service | ledger/reservation plus D1 path to verify | DTOs require idempotency; runtime path not proven | C2 duplicate/concurrent order tests |
| Binary | dashboard/binary; `/api/binary/config` | `binary.controller.ts` | ledger/settlement and D1 paths | Route family present; normal vs sandbox settlement proof pending | C2 settlement and retry tests |
| Wallet / financial | dashboard/wallet; withdrawals/transfers/conversion/deposit clients | `wallet.controller.ts`, `financial-operations.controller.ts` | ledger + D1 gateway/EventOutbox verification required | Mixed Prisma/D1 reads; high-risk G2 gap | Fail-closed/read-authority tests |
| Loans | dashboard/loans | `loans.controller.ts`, `loans.service.ts` | D1 when enabled; Prisma fallback otherwise | G2 candidate: silent financial fallback | D1-disabled must fail closed |
| Mining | dashboard/mining | `mining.controller.ts`, `mining.service.ts` | D1 when enabled; Prisma fallback otherwise | G2 candidate: silent financial fallback | D1-disabled must fail closed |
| Communications | messages/support/announcements/learn pages | `communications.controller.ts`, `feedback.controller.ts` | D1/service reads; admin parity pending | Source families present | C2 Public/Admin causality |
| Account/security | login/signup/profile/settings/KYC/referral/VIP | auth/profile/KYC/referral controllers | D1 session/user paths; auth guards | Source families present | C2 auth/session/revocation |
| Admin controls | `apps/admin`, `NexiAdminApiProvider` | `admin.controller.ts`, `admin-auth.controller.ts` | D1, audit, approvals, EventOutbox verification | Provider and route families present | C2 Admin provider → Nest → D1 |

## Verified mismatches / risks

1. `loans.service.ts` and `mining.service.ts` fall back to Prisma for financial mutations when D1 is disabled.
2. `wallet.service.ts` mixes D1 and Prisma reads; read authority is not yet uniform.
3. `cloudflare-container-bootstrap/wrangler.jsonc` is the source configuration for the Cloudflare backend platform contract. Current runtime CORS/wallet-auth values are verified through Cloudflare deployment state; future changes require the official-documentation gate and current owner authorization.
4. Live D1 metadata reported zero tables while direct SQL reported 88 tables and 260 indexes; control-plane metadata is inconsistent.

## Evidence boundary

OpenRouter/free reviews are advisory only. Graphify is topology evidence, not behavior proof. C2 is not claimed until a real Public/Admin client reaches an ephemeral Nest HTTP app and authoritative D1 harness with read-back.
