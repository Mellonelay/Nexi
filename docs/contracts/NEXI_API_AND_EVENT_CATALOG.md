# NEXI API and Event Catalog

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state authority:** `NEXI_CURRENT_STATE.md` + `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
**Public visual authority:** `cloudflare-container-bootstrap/dexi-frontend/DESIGN.md`; older design documents are lineage only

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Public API groups
`/auth`, `/users`, `/market`, `/spot`, `/binary`, `/wallet`, `/deposits`, `/withdrawals`, `/mining`, `/loans`, `/support`, `/messages`, `/announcements`, `/learn`, `/notifications`, and `/settings` under an explicit version namespace.

## Admin API groups
`/admin/users`, `/admin/kyc`, `/admin/assets`, `/admin/networks`, `/admin/markets`, `/admin/spot`, `/admin/binary`, `/admin/wallets`, `/admin/ledger`, `/admin/deposits`, `/admin/withdrawals`, `/admin/mining`, `/admin/loans`, `/admin/support`, `/admin/messages`, `/admin/content`, `/admin/notifications`, `/admin/config`, `/admin/health`, `/admin/audit`, and `/admin/sandbox`.

## Event families
Market quote/status; order-book/trade; Spot order lifecycle; Binary position/countdown/settlement; wallet/ledger transaction; deposit/withdrawal status; support/message delivery/read; notification; feature/maintenance; operational alerts.

## Catalog fields
Operation/event name, version, method/topic, actor, permission, request schema, response schema, errors, idempotency, transaction boundary, audit event, producer, consumers, retention/replay policy, rate limits, tests, and deprecation state.

## Immediate known mismatch
The current Binary frontend posts `/binary/position`, but the current controller exposes only static config. The catalog must resolve this before implementation claims.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
