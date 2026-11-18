# NEXI — observability and Sentry verification

This is a **current procedure**, not an ongoing list of prior release statuses. Source/backend/public/admin revision and running artifact version must be determined separately for each check.

- Backend Sentry instrumentation/source release config, Public Next.js edge/server/client config, and Admin \`src/sentry.ts\` may have separate source-map, upload and release identities. Verify exact built SHA, configured environment/release and upload result rather than assuming Git HEAD matches them.
- \`nexi-api.service\`, \`nexi-public.service\`, \`nexi-admin.service\` status and journal are operational evidence. \`/readyz\` only verifies reported dependencies/readiness; it does not establish economic correctness.
- Recorded Jaeger v2/OTLP integration includes a working local smoke trace receiver; collector smoke does **not** prove that API requests are instrumented. Verify live process preload/SDK and an actual sampled trace before claiming end-to-end tracing.
- For a reported failure: obtain UTC timestamp, environment, release/source identity, route/domain, redacted error and its cause. Correlate with Backend financial command/SQLite Ledger/Activity/Audit/Outbox when the effect is economic. Never include cookies, keys, bearer tokens, wallet signatures or confidential payloads in reports.
- Source-controlled Sentry and error telemetry changes require focused checks; live probes, service changes and release uploads are outside a documentation-only task.

Historical Sentry release IDs, alerts and October/November release-event records are preserved in \`tasks/evidence/\` and Git, not presented here as current service state.
