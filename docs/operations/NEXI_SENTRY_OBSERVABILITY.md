# NEXI Production Observability: Sentry


## Telemetry authority

Use the established Worker-0 `mcpc @nexi-sentry` OAuth session and new `sentry` CLI for live inspection; classic `sentry-cli` only for suitable CI/build/release operations. Inspect live schemas/CLI help. Organization `mellonelay`, project `nexi`.

For release work, first use the authenticated Worker-0 `sentry-cli` credential when `sentry-cli info` succeeds; this CLI authentication is independent of 1Password CLI sign-in. The observed credential reports `org:ci`, and a read-only release listing succeeded on 2026-10-26. Sentry documents `org:ci` for CI/deployment work including release creation and source-map upload; its permissions guide also says `sentry-cli` release management needs `org:read`. Verify actual access and project membership before mutations, and do not infer upload, commit-association, or deploy permission from a successful list. If a build integration specifically needs `SENTRY_AUTH_TOKEN` in its process environment, load it with `op run --environment <SENTRY_ENVIRONMENT_ID> -- <command>`; do not use the 1Password MCP. Never print, copy into shell history, or report the token. The Environment ID must come from the authorized NEXI Sentry environment.


## Source owners and privacy

| Surface | Source instrumentation | Release identity |
|---|---|---|
| NestJS backend | `backend/src/instrument.ts` | VPS runtime `SENTRY_RELEASE` must match the deployed backend artifact source SHA |
| Public Next.js | `frontend/instrumentation-client.ts`, `sentry.server.config.ts` | build-time `NEXT_PUBLIC_SENTRY_RELEASE`; runtime `SENTRY_RELEASE`; both must match actual Public source/build artifact |
| Admin React | `Admin/src/sentry.ts` | build-time `VITE_SENTRY_RELEASE` must match actual Admin source/build artifact |

Keep error and warn console logging and tracing; privacy defaults disable PII and mask/block Replay sensitive content. Source-configured browser Replay: 2% ordinary sessions, 100% error sessions. Browser profiling is sampled and requires a supported Chromium-based browser plus `Document-Policy: js-profiling` on the document response. Verify the header and actual ingestion; absence of a sample at low sampling is not automatically failure.

## Release pipeline

For **each independently identified** backend/Public/Admin deployed source SHA, use exactly the full Git 40-character SHA as Sentry SDK release ID. Different artifacts must not be falsely forced to share HEAD.

1. Determine actual deployed revision from its own build artifact and runtime.
2. Check release existence and reuse SDK auto-created release if present.
3. Associate repository commits using official supported CLI/CI flow; diagnose association failures.
4. Finalize only the live artifact release and record production deploy.
5. Confirm release finalization, commits, production deploy, SDK event release and source map mapping to original file/line.

Public `NEXT_PUBLIC_*` and Admin `VITE_*` identifiers are embedded at build time; changing runtime service env after build cannot relabel the deployed JS bundle.

## Rapid defect closure

- Query Sentry current production errors, logs, traces and dropped events by timestamp and **specific artifact release**; unresolved historical issues are not automatically current defects.
- Verify the first-seen/regressed production issue alert, its action and approximately 5-minute evaluation frequency; avoid duplicative alerts.
- Retain the existing `nexi-mining-daily-rewards` single UTC daily Cron monitor (00:00 schedule) and check-in settings; inspect rather than recreate.
- Retain backend scheduler/Mining/Binary application metrics as instrumentation, never as accounting truth.
- Preserve limited uptime quota; do not create extra active monitors without checking allowance.
- Error-session Replay and profiling must be checked via an appropriate controlled acceptance path, never permanent fake-error endpoints.
- If an `ObserveAgentWorker` 429 appears in Sentry logs, attribute it to the actual emitting telemetry subsystem rather than assuming Sentry ingestion failure.

## Verification receipt

Capture surface, deployed full source SHA, runtime/build release value, Sentry release, timestamp, live error/log/trace evidence, source map status, alert/cron state, and unknowns. Separate `SOURCE_CONFIGURED`, `DEPLOYED`, `INGESTION_VERIFIED`, `RELEASE_LIFECYCLE_VERIFIED`. Repeat checks only after impacted deployment/configuration changes.

See [repository documentation map](../README.md), [backend](../backend/README.md), [frontend](../frontend/README.md) and [admin](../admin/README.md).
