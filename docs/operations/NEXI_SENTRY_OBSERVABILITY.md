## 2026-10-29 — three-surface release identity and upload result

Release `7e434daab146fe9c297c04e46ba9d4a0ee81401d` was created, associated with repository commits, finalized, and recorded as a production deployment after all three services started. Backend runtime `SENTRY_RELEASE`, Public runtime `SENTRY_RELEASE` / `NEXT_PUBLIC_SENTRY_RELEASE`, and Admin runtime `VITE_SENTRY_RELEASE` match the artifact markers. Public and Admin generated JavaScript contains Sentry debug IDs (67 and 62 matching files). Admin client/server Vite uploads reported success; the server upload report included at least one chunk without an identifiable sourcemap reference. Public build used the Sentry-enabled Next configuration; its plugin is silent, so remote artifact lookup remains unverified with the current session.

The authenticated CLI credential has `org:ci` and could create/finalize/deploy releases and upload artifacts. `sentry-cli issues list` returned HTTP 403, so current-release issue/event inspection and actual event symbolication are `ACCESS_BLOCKED` / `UNKNOWN`. Do not infer zero errors, inject a fake event, or attribute old aggregate network-drop counts to this release. Recheck with an authorized read-capable Sentry session during the bounded post-deployment follow-up.

## 2026-10-27 — current deployed release evidence correction

Sentry `get_release_details` directly confirms the exact Backend `20ba4da6cc34fd8f355324bbf2ab401db2665ef0` and Public/Admin `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` commits attached to their finalized production deployments. Previous documentation claiming Public/Admin commit association unresolved is superseded. Deployed JS contains Sentry debug IDs (Public 67/70 static JS, Admin 62/62 asset JS); Admin build recorded 124 uploaded sources. Backend env has production/full SHA, Sentry DSN and `NODE_OPTIONS=--enable-source-maps`; generated map parses with Node SourceMap. This is partial map configuration proof, not evidence that a captured event was symbolicated. The 24-hour NEXI project outcome buckets show 195 `client_discard/network_error` and 14 accepted errors, but do not identify the SDK/surface/release responsible. No arbitrary DSN or sample-rate changes are authorized from this aggregate. Three `Cannot POST /` backend logs belong to external Nginx 404 probe activity, not an internal API contract failure. Detailed receipt: `tasks/evidence/nexi-post-release-reconciliation-20261027.md`. Next actual browser event may close the event-level source-map proof; do not manufacture an error endpoint.


# NEXI Production Observability: Sentry

## 2026-10-31 — current rapid-detection verification

Production source release `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` is present in Sentry with its source commit and production deployment association. The three live artifact markers match this release; this does not imply the artifacts are byte-identical. A 24-hour production search found no error events tagged with this release, while real production traces/spans with this release and environment were ingested. This proves trace ingestion, not complete error-delivery reliability.

The existing enabled issue workflow `6146426` was retained and updated to trigger on new issues, regressions, and archived issue reappearances. It is scoped to project `nexi`, environment `production`, and retains the active email action to issue owners with active-member fallthrough. Its five-minute frequency is a notification frequency setting, not measured alert evaluation or end-to-end delivery latency.

An enabled static error monitor `10813107` now counts production `level:error` events over 300 seconds and triggers above five, resolving at five or fewer. It is connected to workflow `6146426`; no destination or integration was added. This gives a five-minute observation window, but delivery speed has not been measured because no natural qualifying burst was observed. Do not present this as guaranteed five-minute delivery.

The owner screenshots show the Oct 2–Nov 1 usage period: 403/50,000 errors, 4.5M/50M spans, 13.75 MB/5 TB logs, 99.45 MB/5 TB application metrics, 5/500 replays, Cron 1/1 and Uptime 1/1 at capacity, and one active Seer contributor. These are screenshot values, not a live billing API read. No sampling increase was made. Preserve the existing daily rewards Cron monitor and single active uptime monitor; do not add monitors while their capacities are exhausted.

The authenticated Sentry catalog and CLI do not expose deletion of stored issue events. Sentry's permission reference says events are immutable and deletion removes the whole issue group, requiring `event:admin`; this can also remove newer-release events grouped with older ones. Historical events were not deleted, issues were not resolved to hide them, and releases were not deleted. A 90-day production issue search returned 34 grouped issues, but that result does not establish that each event belongs to an older release. See `tasks/evidence/nexi-sentry-detection-20261031.md` for current classifications and proof limits.

Current-release event-level symbolication remains `NOT_YET_OBSERVED`: the current release has no captured error event to inspect, and no new build or source-map upload was performed. Previous Admin upload evidence remains 124 reported files; Public remote upload and all-surface event symbolication are not proven. Sampling remains at the existing 5% trace rate and privacy-masked, low-volume replay configuration.


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
