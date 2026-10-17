# NEXI Production Observability: Sentry

**Objective:** use Sentry for VPS and frontend runtime faults: exercise an instrumented feature → receive the error/trace/log → identify the causal source → repair and verify. This file documents source and operational requirements; it does not assert current ingestion/release status without fresh evidence. Public DNS routes to the VPS; Cloudflare Worker/Container/async resources remain active and D1 remains populated/current financial data authority until the gated writer cutover. Cloudflare Observability stays disabled.

## Telemetry authority

Use the established Worker-0 `mcpc @nexi-sentry` OAuth session and new `sentry` CLI for live inspection; classic `sentry-cli` only for suitable CI/build/release operations. Inspect live schemas/CLI help. Organization `mellonelay`, project `nexi`.

**Cloudflare Observability stays disabled:** do not activate Worker logging/tracing persistence, drains or Cloudflare-based OpenTelemetry sinks. Use Sentry SDK-native errors, spans/traces, logs, metrics, Cron monitoring.

## Source owners and privacy

| Surface | Source instrumentation | Release identity |
|---|---|---|
| NestJS backend | `backend/src/instrument.ts` | VPS runtime `SENTRY_RELEASE` must match the deployed backend artifact source SHA |
| Public Next.js | `cloudflare-container-bootstrap/dexi-frontend/instrumentation-client.ts`, `sentry.server.config.ts` | build-time `NEXT_PUBLIC_SENTRY_RELEASE`; runtime `SENTRY_RELEASE`; both must match actual Public source/build artifact |
| Admin React | `apps/admin/src/sentry.ts` | build-time `VITE_SENTRY_RELEASE` must match actual Admin source/build artifact |

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
