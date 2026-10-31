# NEXI Sentry detection and history review — 2026-10-31

## Stage B release follow-up — 2026-10-31

The Admin-only production release is `737355124993705935f9aa56f743a9f1f61a2bf4`. Sentry release detail confirms its Git commit and production deploy `175244175`. The exact-release production error search over 30 minutes returned 0 events; the exact-release production span search over 30 minutes also returned 0 spans. These are bounded query results, not proof of complete ingestion or delivery. No artificial event was sent and no alert configuration was changed. The build uploaded client/SSR/Nitro artifact bundles; one SSR source-map entry had no auto-detected map reference. Event-level symbolication remains NOT_YET_OBSERVED. `SENTRY_ALERT_DELIVERY_VERIFIED=UNKNOWN`; `MINUTES_SCALE_DETECTION_MEASURED=NO`.

The Stage B receipt records Admin browser evidence and acceptance boundaries. The original detection audit below reflects the pre-release `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` three-surface baseline and remains historical for that query window.

## Scope and identity

This is a bounded Sentry configuration and production evidence receipt. No source code changed; no application build, service restart, deployment, financial operation, artificial production error, or Sentry history deletion was performed.

- GitHub/source documentation frontier observed: `ec24cc5f5f7794d610fd8da618534d7fbdc2c388` (`HEAD = origin/main` before these documentation edits).
- Deployed application release: `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` on Backend, Public, and Admin markers. Public build ID: `uljjzCtkvCSVGUPLSIB3x`. Surface artifact identity remains independently represented by each surface marker/build; matching source SHA does not prove identical artifacts.
- Sentry organization/project: `mellonelay` / `nexi`.
- Authenticated Sentry MCP reads, issue searches, release reads and alert management returned data. `sentry-cli` 3.7.0 separately reported `org:ci`; this credential was not used to delete events.
- Services were observed active with zero systemd restarts; none were restarted for this work.

## Minutes-scale detection

Existing enabled issue workflow `6146426` (“NEXI production — new or regressed issue”) was preserved and updated. It is scoped to project `nexi` and `production`, triggers on first-seen, regression, and reappeared issues, and retains its active email action to issue owners with active-member fallthrough. It retains `frequency: 5`. That value is not proof of a five-minute evaluation cadence or end-to-end delivery.

Enabled static error monitor `10813107` (“NEXI production — error spike (>5 in 5m)”) was added in project `nexi`. It queries `level:error`, `count()`, environment `production`, dataset `events`, error event type, and a 300-second window. It triggers above five and resolves at five or fewer. It is connected to existing workflow `6146426`; no new destination or recipient was configured.

No natural qualifying burst occurred during this verification, so alert generation and notification delivery were not measured. The monitor window and existing five-minute workflow frequency are configuration evidence only. The result can become visible on that window after Sentry ingests enough errors, but several-minute notification delivery is not guaranteed or measured.

## Production ingestion and release association

Sentry release `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` exists with the expected source commit and a production deployment association. Over the queried 24-hour window, no error events were returned for that exact release and `production`; real traces/spans tagged with the exact release and production environment were returned. This verifies production trace ingestion and release tagging, not complete error capture or that no application failures occurred.

The screenshot supplied by the owner showed the Oct 2–Nov 1 billing period: errors 403/50,000; spans about 4.5M/50M; logs 13.75 MB/5 TB; application metrics 99.45 MB/5 TB; replays 5/500; Cron monitors 1/1; uptime monitors 1/1; Seer 1 active contributor. It showed a capacity warning for Cron/Uptime. These are screenshot observations, not a live billing API result. No sampling rates were increased. Existing source configuration remains 5% tracing; replay remains low-volume and privacy-masked, with error-focused replay.

The existing daily `nexi-mining-daily-rewards` Cron monitor had a successful production check-in at 2026-10-31 00:00:38 UTC. `NEXI-13` latest missed check-in issue was from `vps-staging`; classify `MONITOR_CONFIGURATION`, not a current production application regression. The single active `NEXI Public` uptime monitor was healthy; disabled uptime monitor records remain disabled because capacity is 1/1.

## Issue classifications

The 90-day production issue search returned 34 grouped issues. Its result is an issue inventory, not an event-by-event release export. A grouped issue may contain events from different releases, so no blanket old-release classification or deletion count is inferred.

| Candidate | Evidence | Classification |
| --- | --- | --- |
| `NEXI-18` — SQLite connection not open | Latest examined event was 2026-10-30 14:25:21Z, production, release `7e434daab146fe9c297c04e46ba9d4a0ee81401d`; cron/outbox stack. It predates deployed `a72c312...`. | `HISTORICAL_ONLY` relative to the deployed release; no source change or issue resolution. |
| `NEXI-13` — mining rewards Cron | Latest failed check was staging monitor behavior; production check-in was successful. | `MONITOR_CONFIGURATION`; not a production app regression. |
| Other grouped issues in 90-day search | Historical market, Socket/Redis, Prisma/DB, financial, auth, and HTTP issues remain in the feed. Individual latest event release/time was not fetched for all 34 groups. | `NOT_ENOUGH_EVIDENCE` to call current-release regressions or to assert all events belong to older releases. |
| Exact deployed release `a72c312...` | No production error event found in the bounded 24-hour exact-release search; production trace/span data exists. | No current-release error confirmed in this query window; this is not evidence of zero failures or complete ingestion. |

No issue was resolved or ignored to clean the dashboard.

## Old event deletion request

The owner requested deletion of all stored events associated with older releases. The authenticated Sentry MCP catalog was searched for event deletion and exposes event/issue search, issue status updates, and unrelated monitor/alert deletion, but no stored event purge/delete operation. `sentry-cli issues` also has no delete operation; the available CLI identity has `org:ci`. Sentry's official permissions reference says events are immutable and deleting an issue removes the entire issue group; this requires `event:admin`. Group-level deletion could also erase newer-release events co-grouped with older events. The active connection does not expose this destructive operation, and the 34 grouped issue result does not identify every event's release, so no target list was fabricated. Historical data remains intact. Deleting Sentry releases is a different operation and was not attempted.

## Source maps and remaining proof

- Admin: release receipt reports 124 uploaded source files; event-level symbolication is not observed.
- Public: remote artifact upload and event-level symbolication not established.
- Backend: source-map runtime support was previously verified; no current-release event was available to prove symbolication.
- Three-surface symbolication status: `NOT_YET_OBSERVED`. No rebuild or arbitrary upload was made.
- Alert delivery latency: unmeasured; no artificial event was created.
- Live billing-period quota API: not available in the connected tools used; screenshot values above are dated.
- Current-release error count completeness: unknown due bounded search and observed client-side network-drop outcomes in the 24-hour outcome data.

## Completion fields

| Field | Result | Evidence boundary |
| --- | --- | --- |
| `SENTRY_MCP_CONNECTED` | YES | Authenticated MCP read and alert writes succeeded. |
| `SENTRY_EVENT_READ_VERIFIED` | YES | Production errors/traces and grouped issue queries returned data. |
| `SENTRY_RELEASE_ASSOCIATION_VERIFIED` | YES | Exact release, source commit and production deployment association returned. |
| `SENTRY_PRODUCTION_INGESTION_VERIFIED` | YES | Production traces/spans under release `a72c312...` observed; no exact-release error event in query window. |
| `SENTRY_ALERT_RULES_CONFIGURED` | YES | Issue workflow updated and error monitor enabled/connected. |
| `SENTRY_ALERT_DELIVERY_VERIFIED` | UNKNOWN | No natural trigger and no delivery receipt. |
| `MINUTES_SCALE_DETECTION_MEASURED` | NO | 300-second monitor window configured; end-to-end latency not measured. |
| `THREE_SURFACE_SYMBOLICATION_VERIFIED` | UNKNOWN | No event-level proof for any surface. |
| `CURRENT_RELEASE_ERRORS_CLASSIFIED` | UNKNOWN | Bounded exact-release production search returned no errors in 24 hours; this is not exhaustive classification of historical grouped issues or all event releases. |
| `NEXI_DOCUMENTATION_RECONCILED` | PARTIAL | Sentry operations guide and this receipt updated. Shared task/state ledgers were left to their active Coordinator owners. |

## Next action

If the owner still wants stored events purged, use Sentry's authorized organization administration/data-retention path with an explicit older-release selection and a supported deletion control; then verify the affected stored data is gone. Do not delete releases as a proxy for deleting events.
