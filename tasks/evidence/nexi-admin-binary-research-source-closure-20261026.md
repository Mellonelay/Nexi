# Admin Binary research-control source reconciliation — 2026-10-26

## Scope and identity

- Repository: `/home/mellonelay1999/workspaces/Nexi`
- Source: `main@1e2d28dcdc3ad303d1f20cdef11c3137d2d98127`, equal to `origin/main` at the last live Git read; working tree contains unrelated owner/campaign edits.
- Scope: source-only reconciliation of Admin account default (A03) and position override (A04) research controls. No implementation change was needed.

## Expected design and actual source

The owner-approved Admin contract requires account-level defaults and position-specific overrides to remain distinct; only approved research accounts and eligible open positions may expose an override. Mutations use the canonical Admin provider/backend boundary, require authorization and reason, carry idempotency/version data, reject stale or closed positions, and refresh state from the backend authority.

Current source already implements this slice:

- `Admin/src/routes/users.tsx` exposes the future-trade account default only for `binaryResearchEligible` users. It presents the current mode, uses `ConsequentialActionDialog` with `binary.edit`, sends actor/role/environment/reason through the existing provider contract, and refreshes the user list after success.
- `Admin/src/routes/binary.tsx` contains `PositionResearchControl`. It limits editing to `researchEligible` rows with `status === "open"`, displays account default, position override, effective mode and `researchControlVersion`, and supports `DEFAULT`, `NORMAL`, `WIN`, and `LOSS`. It uses the consequential action dialog and `binary.edit`, submits the current version, and refreshes the position query after success.
- `Admin/src/admin/data/nexi-api-provider.ts` maps the operation to `PATCH /admin/binary/positions/:id/research-control` and includes the expected control version, reason and idempotency key.
- `backend/src/admin/admin.controller.ts` binds the route to `binary.edit`; `admin.dto.ts` validates the mode, expected version, reason and idempotency key; `admin.service.ts` validates research-account eligibility and active/unexpired position state, rejects version conflicts, then performs the state update and audit within a transaction.

The existing Admin test `Admin/test/nexi-api-provider-reorder.test.mjs` includes assertions for the eligible/open-position gate and excludes settling rows. It was not rerun for this documentation task. Graphify was queried first for ownership/cross-layer paths; its promoted snapshot was about 9 hours old at the same source SHA, so it was used only for navigation. Direct source readback verified the current working tree.

## Disposition and evidence limits

No Admin source gap was found; no route patch or additional test was justified. This records `SOURCE_CONFIRMED` only. No live position was changed, no authenticated route was exercised, no test/build/install was run, and no deployment or browser acceptance is claimed. The historical A03/A04 rows are clarified in the dated follow-up at the end of `Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md`; A05/A06 remain outside this review.
