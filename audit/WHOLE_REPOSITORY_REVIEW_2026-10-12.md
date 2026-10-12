# NEXI Whole-Repository Audit — Review Brief

Status: **AUDIT REQUEST / NOT A RELEASE CANDIDATE**  
Baseline: GitHub `main` at `473323c876736bb3ca9ab39733b6ad82913fc8b3` (2026-10-12).  
Scope: entire committed repository at the pinned baseline. This audit branch does **not** contain Worker-0 uncommitted frontend changes.

## Purpose

Provide a stable, reviewable GitHub conversation for an independent, read-only architecture, security, correctness, CI, and production-readiness assessment. A Draft PR's diff is **only this audit brief**; it must not be misrepresented as a full-repository diff or completed audit.

## Repository-wide review areas

- Domain ownership: NestJS business authority; Cloudflare D1 durability; Ledger accounting; EventOutbox publication; Valkey cache/realtime; Worker edge; Public/Admin API consumers.
- Authentication, SIWE, session/replay safeguards, RBAC, IDOR/tenant isolation, admin privileges, KYC private R2 evidence.
- Financial mutations and invariants: Wallet, withdrawals, transfers, conversion fees, Spot, Margin, Binary, Mining and Loans; idempotency, audit and rollback/recovery boundaries.
- Market data: provider provenance, quote freshness, 53-instrument market catalog vs funding currencies, depth/trade semantics.
- Communication services: messaging, notifications, announcement/learn publication, queues, sockets, retries and durable replay.
- Frontends: contracts, Quiet Refraction, accessible/mobile/wallet-browser geometry, integrity of state and error handling, no invented data.
- Supply chain: lockfiles, dependencies, secrets exposure, workflow permissions, CI/build/release configuration, Cloudflare binding and deployed identity reconciliation.
- Tests and evidence: failing or absent targeted tests, static analyzers, browser acceptance, runtime telemetry and known blocked contracts.

## Evidence rules

1. Treat owner decisions and live, revision-bound proof as controlling; `main` is committed source authority, not proof of what the VM or Cloudflare currently serves.
2. Classify each finding with affected path/line, severity, direct evidence, scope, exploitability/impact and a minimal corrective owner. Mark unverified claims as such.
3. Reuse `PROVEN + UNCHANGED`; do not revive stale issues or demand repeat tests for unchanged paths.
4. Keep `IMPLEMENTED`, `TESTED`, `RUNTIME_VERIFIED`, `DEPLOYED`, and `OWNER_ACCEPTED` distinct.
5. Read-only audit. No production requests that mutate funds, authentication, KYC, D1, Cloudflare, or infrastructure; no commits/merges/deployments from this review.
6. Distinguish static tools (Graphify/Fallow/React Doctor/CodeQL if available), dynamic tests (Strix only with separately authorized safe targets), and PR checks. Their findings are support, not unconditional proof.
7. Do not mix in uncommitted Worker-0 changes without a separate, identified snapshot and explicit owner authorization.

## Deliverable requested from reviewers

Report verified findings ordered by severity, architecture/authority conflicts, unverified runtime gates, remediation ownership and minimal acceptance checks. Record checked baseline and independent reviewer provenance. Distinguish blockers from improvement opportunities.

## Known limitations at creation

- This PR adds only this markdown audit brief and does not exercise a full repository scan by itself.
- No independent full-repository audit, tests, release, Strix penetration scan, or production acceptance has been completed by creation of this PR.
- GitHub Actions configured for pull requests may start automatically; their results are not known in advance.
- Do not merge. Close this audit-only PR when review is concluded, or leave it open as a tracking discussion.
