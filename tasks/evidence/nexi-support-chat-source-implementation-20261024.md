# NEXI Support and Messages source implementation — 2026-10-24

## Scope and status

This receipt covers the owner-approved Support contact and Public-to-Admin chat source batch. It does not claim a deployed or browser-accepted conversation flow.

- Task: P3.2 — **SOURCE_IMPLEMENTED / TESTED / INTEGRATED in the shared working tree; uncommitted**.
- Deployment/runtime/browser: **NOT DEPLOYED / NOT RUNTIME_VERIFIED / NOT BROWSER_VERIFIED**.
- Owner acceptance: pending the later authenticated browser phase. No customer message or financial operation was performed.
- Source baseline at verification: `HEAD == origin/main == 01ff280f739dd16637c352566d46af6f7ec2aed5`; working-tree changes remain dirty and include other pre-existing campaign edits. Do not treat this receipt as ownership or approval of every dirty file.
- Runtime snapshot, read-only: Backend `20d10c4d85bb733ae4bba680ad919fc35b98e344`, Public `3bb57e02ea921531975124ce2c827382a9f1ec6b`, Admin `b3103ad7b07937616815b487efa212b324bdbce2`; all three services reported active. These are runtime identities observed on 2026-10-24, not identities for this uncommitted source.

## Implemented contract

- Public Support retains help content and has no active ticket form/list/API calls. It reads configured contact data and presents Chat, Telegram, and email actions only when valid persisted contact values are enabled.
- Telegram/email are stored through the existing Admin-managed system configuration path, validated at the Backend boundary, and read back before Admin reports a successful save. Public reads the normalized `GET /public/config/support` response; no sample address or handle is seeded.
- Public Messages is a single NEXI support conversation. The client does not choose a recipient. Backend derives the authenticated customer and stable `support:nexi` channel identity. A first message creates the canonical conversation; a successful empty GET returns that stable ID without writing a conversation or changing read state.
- Public and Admin use the same canonical conversation ID. Admin list data derives `supportCustomerId` from conversation participants and replies through the existing Admin mutation path. The durable message actor is the support channel; the actual operator remains in the Admin audit record.
- GET thread history is read-only. Public and Admin explicitly call their recipient/permission-scoped read endpoints and reconcile the persisted `readAt` result.
- SQLite/Prisma message and Outbox writes remain in the existing durable transaction path; local SQLite bridge writes continue through its atomic batch. Valkey/Socket.IO carry notifications, while clients reconcile history from the API after reconnect.
- Attachments use authenticated upload/download routes, server-owned IDs, private per-customer storage, bounded PNG/JPEG/WebP/PDF validation, 5 MiB per-file and four-file limits, and conversation linkage before download. The implementation does not claim malware scanning; that remains an operational limitation.
- Historical support ticket tables/records remain. Ticket flows are removed from the active Public/Admin product path without a destructive migration.

## Changed source areas

- Public: `frontend/app/dashboard/support/page.tsx`, `frontend/app/dashboard/messages/page.tsx`, communications source-contract tests, and removal of the obsolete message endpoint example.
- Admin: Support contact settings UI/provider and Messages grouping, pagination, read, send, and attachment paths under `Admin/src/routes/` and `Admin/src/admin/`.
- Backend: Communications controller/DTO/service/gateway/module, private attachment service, Admin support-contact configuration, and focused communications/config tests under `backend/src/` and `backend/test/`.

The worktree contains additional modified files from earlier parallel campaign work. The file groups above identify the source boundary covered here; they are not a complete attribution of every dirty path.

## Verification executed

- Backend focused Jest: six suites, 30 tests passed — communications service, conversation identity, message reads, controller, realtime gateway, and public support configuration.
- Backend support-attachment storage Jest suite: one suite, 8 tests passed (parallel lane receipt).
- Backend source typecheck: `./node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.build.json` — exit 0.
- Admin contact contract tests: 2/2 passed (parallel lane receipt). Admin typecheck: `corepack pnpm@12.14.0 --config.verify-deps-before-run=false run typecheck` — exit 0.
- Public UI contract: 9/9 passed; Public communications contract script passed; targeted ESLint passed; the official package `npm run typecheck` ran `next typegen` successfully and then `tsc --noEmit --incremental false` — exit 0.
- `git diff --check` — exit 0.
- Graphify refreshed once after the source batch: 6,732 nodes and 18,171 edges. Confirmed source import paths: CommunicationsController → CommunicationsService; Admin messages route → context → API provider; Public messages page → API client. Graphify does not represent the HTTP contract between separate apps, so those request/response seams were compared directly against controller, DTO, provider, and UI source.
- Fallow 3.30.0 was run separately against Public, Admin, and Backend changed paths. Public and Backend reported zero scoped findings. Admin reported two unused-export observations (`NexiAdminApiError`, `NotConnectedError`) that already existed at HEAD and are used internally in their files; they were not treated as new defects. The Backend scan notes generated minified Prisma WASM JS is skipped; Fallow is structural evidence, not behavior proof.
- Nest CLI 12.0.3 was inspected and used for a no-write generator dry run. It showed the service scaffold/module update it would create; the target provider already exists, so no generated files were written. Next CLI 16.4.1 `next typegen` ran through the Public package typecheck. Admin already uses its Vite/TanStack route plugin; no new route scaffold was required.

## Not established by this receipt

- A real authenticated Public send → Admin thread → Admin reply → same Public thread readback, persistence after refresh, reconnect recovery, or restricted-role denial.
- Live configured attachment storage availability, malware scanning, or a real private-object round trip.
- Visual/browser matching to the approved reference, production artifact identity for these uncommitted changes, deployment, or final owner acceptance.
- A broad NestJS Doctor scan; its previously supplied whole-repository findings are not treated as a verdict on this bounded source batch.
