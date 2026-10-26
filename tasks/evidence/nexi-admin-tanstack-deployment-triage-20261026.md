# Admin TanStack deployment triage — 2026-10-26

**Historical assessment: `DEPLOYMENT_REVIEW_REQUIRED` — superseded by the package-local follow-up below.**

**Current disposition:** Source-to-artifact review resolved this advisory for the existing Admin artifact. No Admin install, build, or redeployment is currently required. The deployed handler matches the patched `@tanstack/start-server-core` 1.169.42 implementation, and the lock and bundle closure include Seroval 1.6.9. No exploit was reproduced; this does not establish every dynamic path or broad authentication correctness. The original analysis and evidence below are retained as historical context.

## Observed source and dependency state

The primary controller reports `main` and `origin/main` at `56da6ce67d7f53410fae9d66d777967793b94fc3`; `Admin/package.json` and `Admin/pnpm-lock.yaml` have no local diff. The lock resolves `@tanstack/react-start` **1.169.1**, `@tanstack/start-server-core` **1.169.42**, and `seroval` **1.6.9**. The live `/srv/nexi/admin/shared/node_modules` resolves **1.169.1**, **1.169.31**, and **1.6.4**, respectively. Thus the committed lock has a patched Start core, while the live shared store's core is below the advisory's fixed version **1.169.39**. React Start 1.169.1 meets its separate fixed-version threshold **1.168.60**. Sources: [`Admin/pnpm-lock.yaml`](../../Admin/pnpm-lock.yaml), [`Admin/package.json`](../../Admin/package.json).

## Deployed artifact and reachability boundary

The primary controller identifies the canonical Admin artifact marker as `ace72accfe815abf5ba20df26ee57c76898d0cab`. `/srv/nexi/admin/current/.nitro/nitro.json` was observed with build time `2026-10-25T04:24:10.871Z`. Its `server/_ssr/server-D3ko4fxD.mjs` contains `handleServerAction`, `createServerFnErrorResponse`, and an import of `fromJSON` from bundled `server/_libs/seroval.mjs`; [`Admin/src/start.ts`](../../Admin/src/start.ts) line 24 filters CSRF middleware to `handlerType === "serverFn"`.

These observations establish package/code presence and a server-function handler path in the built bundle. They do **not** establish that a particular unauthenticated request reaches a vulnerable branch, that application authorization is bypassed, or that an exploit succeeds. No exploit proof or reproduction is available. No broad authentication protection is inferred from the CSRF filter.

## Advisory assessment

TanStack's [GHSA-qx66-fv34-fjm8 advisory](https://github.com/TanStack/router/security/advisories/GHSA-qx66-fv34-fjm8) and [CVE-2026-102989 security update](https://tanstack.com/blog/tanstack-start-security-update-cve-2026-102989) describe unauthenticated reflected XSS in server-function responses and identify `@tanstack/start-server-core` 1.169.39+ and `@tanstack/react-start` 1.168.60+ as fixed. The live store's core version is within the affected range; the lock's core version is above the fix threshold. This is a version and deployed-state finding, not reproduced exploitability.

For [CVE-2026-104846](https://nvd.nist.gov/vuln/detail/cve-2026-104846), the supplied NVD threshold is Seroval 1.6.2+. Both the observed live shared-store version 1.6.4 and lock version 1.6.9 exceed that threshold. The deployed artifact bundles Seroval code, but its exact bundled package version was not established here.

## Blocker and next safe action

The committed lock and canonical shared store are not reconciled, so the existing Admin artifact cannot be treated as rebuilt from the patched locked dependency set. A retained rollback archive exists at `/srv/nexi/admin/shared/rollback-admin-b3103ad-to-ace72ac-20261025.tar`; its checksum and integrity were not checked for this receipt.

Next, the release owner should reconcile the canonical Admin store to the committed lock using the pinned Corepack pnpm procedure and verified rollback, then rebuild only to `/srv/nexi/admin/current` and verify the artifact marker, service/runtime identity, and relevant behavior. This receipt performs no install, build, service action, or deployment. Until that review and verification are complete, keep Admin at **`DEPLOYMENT_REVIEW_REQUIRED`**.

## Skill rule applied

Applied `security-and-hardening`: assess dependency advisories by installed/deployed reachability and do not treat a version match as proof of exploitation. Applied `source-driven-development`: identify exact committed versions and cite authoritative maintainer/advisory sources for framework security thresholds.

## Follow-up — package-local Admin runtime resolution

This correction supersedes the earlier inference that Admin was awaiting redeployment for CVE-2026-102989 solely because top-level package aliases were older. The existing [security triage receipt](./nexi-security-dependency-triage-20261025.md#follow-up-evidence--admin-bundle-and-public-sentry-reachability--2026-10-25) records package-local resolution: the top-level `@tanstack/start-server-core` 1.169.31 and Seroval 1.6.4 coexist with the `@tanstack/react-start` 1.169.1 closure resolving Start Server Core 1.169.42 and Seroval 1.6.9. Both the committed Admin lock and deployed artifact lock resolve React Start 1.169.1, Start Server Core 1.169.42, and Seroval 1.6.9.

The same receipt records a token-level comparison of the deployed `createServerFnErrorResponse` handler with the installed `@tanstack/start-server-core@1.169.42` handler, including the patched `protectResponseHeaders(errorResponse, SERIALIZED_JSON_HEADERS)` behavior. The top-level 1.169.31 package does not expose that function. This is bounded source-to-artifact evidence that the active bundled handler is patched; package-local aliases alone do not establish a vulnerable executed dependency. Seroval 1.6.9 also exceeds NVD's 1.6.2 fixed-version threshold for [CVE-2026-104846](https://nvd.nist.gov/vuln/detail/CVE-2026-104846). See the [TanStack advisory](https://github.com/TanStack/router/security/advisories/GHSA-qx66-fv34-fjm8) and [TanStack security update](https://tanstack.com/blog/tanstack-start-security-update-cve-2026-102989).

Fresh parent checks report the Admin marker remains `ace72accfe815abf5ba20df26ee57c76898d0cab`, `nexi-admin.service` active on pinned Node 24.21.0 with `NRestarts=0`, and `/overview` returned HTTP 200. No Admin install, build, or redeploy was necessary for this finding. No exploit was reproduced, and direct runtime behavior was not re-tested in this follow-up. This does not prove every dynamic path or constitute broad authentication assurance.
