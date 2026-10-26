# Conversion and KYC Authentication Surface Correction — 2026-10-26

## Scope and source authority

- Source checkpoint: `1e2d28dcdc3ad303d1f20cdef11c3137d2d98127`; branch `main`, equal to `origin/main` at intake. Existing dirty files and receipts were preserved.
- Active modules: `ConversionModule` and `KycModule` are registered in `backend/src/app.module.ts`. `ContractModule` is not registered and was excluded; no inactive controller was changed.
- Guard DI source path: both active modules import `AuthModule`; `AuthModule` lists `AuthSurfaceGuard` as a provider and exports it. This confirms the Nest module visibility needed by the controller decorators at source level. No application-context compile or runtime restart was run, so runtime DI resolution for this unshipped change remains unverified.
- Expected design: session JWT authentication establishes identity; each protected controller handler then checks the intended PUBLIC or ADMIN session surface using existing `AuthSurfaceGuard` metadata. Admin rate mutation retains the ADMIN role guard. KYC ownership remains enforced after the PUBLIC surface guard.
- Existing callers: Public Conversion and Settings/KYC consumers use the customer-facing routes; Admin conversion rate changes use the admin route. No request/response or persistence contract changed.

## Knowledge and design-to-source method applied

- Addy `using-agent-skills`: implementation and verification phase selected `source-driven-development`, `security-and-hardening`, `incremental-implementation`, and `test-driven-development`; their instructions were read/applied to trace owner and callers, preserve least privilege, make a thin change, and prove the defect red then green.
- Ponytail full mode: reuse the existing guard/decorator pattern, make the smallest complete patch, keep a focused regression assertion, and review caller/guard ordering.
- Vibe Coding Library 1.6.1 `rbac-abac-policy-audit` and `rbac-abac-policy-polish`: backend enforcement is authoritative; do not redesign the permission model; keep trusted surface claims server-derived; check relevant allowed/denied states and preserve existing role/ownership conditions.
- Graphify was queried before direct source reads to locate controller/module ownership and AuthSurfaceGuard relationships. Direct source inspection confirmed the route mapping and inactive ContractModule boundary.
- Installed backend versions: `@nestjs/common` and `@nestjs/core` 12.0.3. Context7 returned official Nest request-lifecycle/guard-order and Reflector documentation. Guard order is JWT, surface, then role/ownership checks.
- VibeDoctor project status was retrieved (scan dated 2026-10-25). A bounded security check covered the two changed controllers and the regression test; it reported the intentionally public `GET /conversion/rate` as “Unprotected API route”. The VibeDoctor note for finding `a66187fc-f054-405c-a84b-5f585743d29c` explains this false positive; the finding remains open and the check did not cover cross-file authentication or dependencies.

## Confirmed discrepancy and correction

Before the change, `POST /conversion/convert`, `POST /conversion/admin/rate`, and four protected KYC handlers used JWT but did not enforce session surface. This allowed a valid JWT from the wrong login surface to reach handlers that only checked identity or role.

- Conversion `convert`: add `AuthSurfaceGuard` after `JwtAuthGuard` and require `PUBLIC`.
- Conversion `setRate`: add `AuthSurfaceGuard` between `JwtAuthGuard` and `RolesGuard`, require `ADMIN`, retain `@Roles(Role.ADMIN)`.
- KYC `uploadEvidence`, `submitKyc`, `getMyStatus`, and `getStatus`: add `AuthSurfaceGuard` after JWT, require `PUBLIC`; retain `OwnershipGuard` on the parameterized status route.
- No service, DTO, token, database, UI, dependency, or data behavior changed.

## Focused proof

- Red: pinned Node 24.21.0 Jest invocation of `test/auth/cross-domain-auth-surface.spec.ts` failed because Conversion and KYC JWT handlers lacked surface guard metadata.
- Green command, run in `backend/`:

  ```sh
  PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand --runTestsByPath test/auth/cross-domain-auth-surface.spec.ts test/runtime/identity-authorization.spec.ts
  ```

- Result: 2 suites passed, 19 tests passed. The new regression checks all protected handler names, surface metadata, and JWT→surface→role guard ordering; the existing suite checks AuthSurfaceGuard allow/deny behavior, role denial, KYC principal-derived ownership, and related identity contracts.
- This is focused source/Jest proof. No authenticated HTTP/browser path, app build, deployment, migration, financial action, or production data mutation was performed. Admin/Public consumer runtime acceptance remains outside this proof.

## Review and remaining gate

- Patch review inspected the complete two-controller diff, regression test, active module ownership, guard implementation, and relevant existing identity test.
- `git diff --check` passed after the correction.
- Production release remains gated by owner-deferred rollback preparation and release authorization. Existing production/runtime evidence is unchanged; this source patch is not deployed.
