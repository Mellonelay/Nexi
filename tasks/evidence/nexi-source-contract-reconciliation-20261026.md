# NEXI source and API-contract reconciliation — 2026-10-26

## Scope and authority

- Canonical checkout: `/home/mellonelay1999/workspaces/Nexi`, branch `main`.
- Source checkpoint reviewed: `500a633579ab32652447816a05b27362264d168b` (`origin/main` matched; clean at intake).
- Application source changes from the current closure campaign remain pushed but not built or deployed. This receipt authorizes no build, deployment, restart, browser test, migration, or financial mutation.
- The owner defers storage, backup capacity, and rollback preparation: `ROLLBACK_PREPARATION = OWNER_DEFERRED`. That is not a passed rollback gate.

## Knowledge and workflow applied

- Read Agent Skills `using-agent-skills`; selected API/interface design, source-driven development, documentation/ADR, security review, and context-engineering methods for this source-contract task. Applied the source-driven rule to establish current installed framework semantics and source registration before changing claims; applied the API rule to compare the generated provider contract with active controller ownership; applied Ponytail's minimal-diff rule by declining a speculative controller or client implementation.
- Invoked Graphify against the current repository and the external Engineering Reference Library graph. Repository results located the OpenAPI assurance, capability-routing, and browser acceptance documents. The external graph query returned the NestJS OpenAPI reference as an `ADAPT` candidate; it is navigation evidence, not proof.
- Queried Context7's official NestJS Swagger documentation for `SwaggerModule.createDocument` and safe JSON generation. Confirmed installed `@nestjs/core` and `@nestjs/common` are both `12.0.3`.
- Reviewed current NestJS controller/module source and auth metadata. `ContractController` has per-handler JWT guards but `ContractModule` is not imported by any active module and no Public/Admin consumer was located in the bounded graph/source check. No active route repair is justified by this latent, unmounted module; if activated later, it requires the appropriate PUBLIC surface guard. A bounded review also found explicit HMAC handling on Events and Workflow Commands and development-only protection on Feedback. This is not an exhaustive authorization audit.

## OpenAPI result

Ran the existing canonical generator using pinned Node 24.21.0/npm 11.19.0:

```sh
PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH npm run generate:openapi --prefix backend
```

`docs/contracts/openapi.json` was byte-identical before and after, SHA-256 `1a0b38d88f283a9ae00c0ce597a953d5eb729c7036fba27947045bcd5571d6b3`. No `.openapi-preview.sqlite` was created. This verifies reproducibility of the checked-in artifact against the generator's preview source. It does not establish every route's runtime behavior, all consumer compatibility, or authorization correctness.

## Disposition

- No new application source discrepancy was confirmed by this bounded API/auth review; no code patch, dependency install, or new test was warranted. Existing focused Conversion/KYC and Communications proofs remain reused (2 suites/19 tests and 2 suites/45 tests respectively); they were not rerun.
- Backend parallel lane reviewed current open Backend source items, including Support attachment ownership and Messages contracts. It found existing owner-isolated hashed storage, UUID validation, no-follow file access, owner checks, and the valid-UUID cross-customer denial regression. Its remaining items are authenticated customer/browser proof; it reported no new source defect and did not rerun the existing 1 suite/21 test.
- Public/Admin parallel lane mapped remaining open items to runtime/reconnect, controlled identity, restricted-role, or browser-proof requirements. It found no source mismatch; it retained the Public Zod #279 reachability classification and did not recommend a compatibility-risk upgrade. No tests or build were run because no code changed.
- Updated design-to-source documentation with the generator result and its limits; corrected the source-corpus versus external Graphify-output paths for the v3.1 reference library.
- Updated the browser matrix, `frontend/AGENTS.md`, `docs/frontend/README.md`, and the financial verification wording to use Chrome DevTools MCP only, including its `list_pages` / `select_page` / fresh `take_snapshot` workflow when MetaMask is exposed to the existing session. If the extension prompt is not exposed, the workflow now requires stopping and reporting the boundary; it no longer directs agents to Playwright MCP, Polypane, or a different browser.
- Corrected `frontend/AGENTS.md`'s active realtime note to name promoted VPS SQLite as durable authority instead of D1-backed reads.
- No application build, deployment, service restart, or browser test was performed. Production identity and readiness remain at their separately dated receipts; this source-contract receipt does not refresh them.
