# Cloudflare loan workflow error review — 2026-10-17

## Method
Read-only project-local Wrangler 4.127.1 commands in `cloudflare-container-bootstrap`: `wrangler workflows list`, `wrangler workflows instances list nexi-loan-staging --status errored --per-page 100`, then `wrangler workflows instances describe <workflow> <id> --step-output false --truncate-output-limit 1000` for each returned ID. No trigger, resume, restart, terminate, delete, or queue acknowledgment was sent.

## Observed instances

| Instance | Trigger | Status | Failure | Runtime |
|---|---|---|---|---|
| `nexi-proof-loan-eventtype-object-20261008` | API | Errored | `NonRetryableError: Workflow parameter loanId is invalid` | 0 seconds; no steps |
| `nexi-proof-loan-eventtype-20261008T1730` | API | Errored | `NonRetryableError: Workflow parameter loanId is invalid` | 0 seconds; no steps |

Both are explicitly named proof instances and their immediate validation failure indicates malformed test/probe input, not an accepted loan workflow that needs replay. This is an inference from IDs, trigger, error, duration, and empty steps; no payload was emitted or retained. This closes the earlier unknown-error classification only. It does not prove all Cloudflare dependencies are closed or authorize deleting workflow history/resources.

## Remaining status
Cloudflare Worker cron/queue consumers and the D1 database remain active. Separate blockers remain: sampled VPS SQLite core tables are empty while D1 contains financial/application records; no owner-selected public write-protection action; no authorized test identity; no approved off-VPS encrypted backup destination; final D1 delta and one-writer cutover not complete. No production resource or financial state was changed.
