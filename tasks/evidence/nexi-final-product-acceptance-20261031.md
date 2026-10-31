# NEXI final product acceptance checkpoint — 2026-10-31

## Scope and identity

This is a bounded authenticated production browser checkpoint for Public and Admin, not a full product acceptance or owner sign-off. No application source changed. No test suite, build, deployment, service restart, database write, financial action, message send, attachment upload/download, or Sentry mutation occurred.

- GitHub `main`, local `HEAD`, and `origin/main`: `0f81273e23f5d104fcd987b6ac5e015d82f8290b` (clean before documentation changes).
- Deployed Backend, Public, and Admin release markers: `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b`.
- Public Next build ID: `uljjzCtkvCSVGUPLSIB3x`.
- `nexi-api.service`, `nexi-public.service`, `nexi-admin.service`: active, zero restarts at inspection. API `/readyz`: HTTP 200.
- Root filesystem: 1.9 GiB available, 97% used. No build/deploy was attempted.

## Browser and source evidence

Chrome DevTools MCP attached to the owner's retained Chrome profile. No second browser or profile was started.

| Surface | Observed | Evidence and boundary |
| --- | --- | --- |
| Public authentication | Owner-authorized MetaMask SIWE sign-in completed for the Public origin. | `/auth/wallet/challenge` and `/auth/wallet/verify` returned 201; `/auth/me` returned 200 in the retained browser session. No transaction, spending approval, wallet signature beyond SIWE, or financial operation occurred. Current `/dashboard/messages` DOM was inspected only for page heading; private message bodies were not read. |
| Public Messages / Support | The authenticated Public page is “Nexi Customer Service”; support thread GET returned 200. | `GET /communications/support/thread?page=1&limit=100` returned 200; Socket.IO polling returned 200. Polling does not prove pushed delivery/reconnect. No message was sent. |
| Public dashboard/settings | Mobile Quotes Hub and the four Settings tabs (Profile, Security, Notifications, About) were observed in the existing 392×701 viewport in this acceptance pass. | Market-price API returned 200; Settings auth/preferences/KYC/session/security reads returned 200 in the inspected session. No personal, wallet, or financial values are included here. Other Public routes/viewports remain unaccepted. |
| Admin workspace shell | At 1365×723, the authenticated Admin page showed the eight primary workspace links: Overview, Clients, Trading, Wallet & Finance, Markets, Products, Communications, Administration & Settings. | `/admin/me` returned 200. This proves the shell and role for the observed Super Admin only; lower-role authorization denial was not exercised. |
| Admin markets | `/market-feeds` loaded and its provider feed/runtime reads returned 200/304. | The page reported 270 mappings, including 21 LIVE and 228 DOWN at inspection. This is observed operational state, not by itself a defect: mappings may include multiple/unsupported providers per canonical instrument. Admin `/assets` showed 55 MarketAsset records; the separate Public/Backend canonical pair catalogue contains 53 instruments, so these counts are not treated as a mismatch. |
| Admin Trading | The Binary workspace showed five contextual tabs: Ongoing, History & Settlements, Binary Settings, Spot & Margin, Trading Risk; Sandbox was absent from primary navigation. | The Admin view had two total positions and zero matching the Ongoing filter; its inspector correctly showed the select-a-position empty state. No settlement or trading mutation occurred. |

The eight Admin primary workspace landing routes were reached through the existing signed-in tab: `/overview`, `/users`, `/binary`, `/wallets`, `/assets`, `/mining`, `/messages`, and `/frontend-control`. Selected corresponding reads included admin identity, asset catalogue, wallets/Ledger/deposit/withdrawal queues, loan/mining plans and subscriptions, Messages/moderation, and Frontend Control configuration/incidents (200 or 304). A current 1365×723 screenshot of `/market-feeds` was inspected against the approved compact-shell direction. Private client/conversation/financial field values were not read into the receipt. Route reach and successful reads do not prove the underlying create/update/approval actions, lower-role enforcement, or mobile layout.

The read-only Public route pass reached Dashboard, BTC/USDT Asset Detail, Spot/Margin, Binary, Wallet, Mining, Loans, Support, Announcements, Learn, Messages, and Settings. After data settled, Asset Detail price/klines/asset reads returned 200 and showed a live state; Spot order-book/trade, open-order, Margin quote/position reads returned 200, with no open orders and an unavailable account balance that kept order acceptance incomplete; Binary config/current/history reads returned 304/200 and the account had no eligible position; Wallet overview/activity reads returned 200 with empty/unavailable activity presentation; Mining catalog and account-history reads returned 200 with no positions or rewards; Loans product and account-history reads returned 200 with no loan record or active repayment; Announcements rendered its empty published-content state; Learn rendered no matching published lesson and unavailable learning progress. Support content rendered without an error. This confirms route rendering and selected read contracts, not write lifecycles, persisted mutations, account eligibility, or visual parity at all widths. No economic or communications action was performed.

Source contract review confirms Public “Open chat” enters the canonical support conversation. Backend Public support-thread and send endpoints are explicitly scoped to the authenticated Public user; recipient-selected Public messaging is retired. Admin `/support` retains old ticket records but retires ticket creation/replies/lifecycle controls and links to Messages. This clarifies the implemented Communications relationship; it does not prove end-to-end message send, cross-surface readback, attachment isolation, pushed delivery, or reconnect in the current release.

The approved Admin visual ZIP was recovered at `~/.codex/attachments/0639675e-6697-4080-bbef-ca00c879f5ec/NEXI_Admin_Approved_Visual_Handoff_20261022.zip` (19-file package). It is a design reference, not current rendered proof or owner acceptance. The observed eight-workspace shell and Binary tabs align with those reference elements. Full desktop/mobile comparison across all eight workspaces remains incomplete.

## Acceptance decision matrix

| Required decision | Result | Exact boundary |
| --- | --- | --- |
| `ADMIN_VISUAL_DESIGN_ACCEPTED` | PARTIAL | Reference recovered; eight workspace links and selected rendered Market/Trading layouts observed at desktop. Complete page-by-page/viewport comparison and owner acceptance remain. |
| `ADMIN_FUNCTIONAL_ACCEPTED` | PARTIAL | All eight workspace landing routes were reached and selected reads succeeded. Mutating actions, direct-link refresh proof, and restricted-role denial are not verified. |
| `PUBLIC_VISUAL_DESIGN_ACCEPTED` | PARTIAL | Mobile Quotes Hub, Settings structure, Spot and Messages slices observed. Full product-route and viewport comparison remains. |
| `PUBLIC_FUNCTIONAL_ACCEPTED` | PARTIAL | SIWE, market read, Settings reads, and support-thread read verified. Complete product journeys and writes remain unverified. |
| `THREE_SURFACE_RUNTIME_INTEGRATION_VERIFIED` | PARTIAL | Current Backend readiness plus current Public/Admin API responses observed. Complete action-to-persistence-to-cross-surface readback is not established by these checks. |
| `AUTHENTICATION_AND_RBAC_ACCEPTED` | PARTIAL | Public SIWE and Super Admin session verified. Negative/lower-role RBAC behavior remains unverified. |
| `MESSAGES_REALTIME_ACCEPTED` | PARTIAL | Current support-thread GET and Socket.IO polling verified; no current-release send/readback, push delivery, or reconnect was exercised. |
| `FINANCIAL_ACCEPTED_WITH_RECORDED_EXCEPTIONS` | PARTIAL | Four financial gates remain `OWNER_ACCEPTED_UNTESTED`; this browser pass performed no economic operation. |
| `OPERATIONAL_RELEASE_READY` | PARTIAL | Deployed services and readiness passed; root disk is 97% used with 1.9 GiB free, rollback preparation remains owner-deferred, and off-VPS full restore remains unproven. |
| `FINAL_OWNER_ACCEPTANCE` | OWNER_DECISION_REQUIRED | Codex does not set this field on the owner's behalf. |

## Preserved limitations and next decision

- Sentry issue workflow `6146426`, five-minute error monitor `10813107`, release/deployment association, production spans, and bounded exact-release search are recorded in [Sentry detection evidence](nexi-sentry-detection-20261031.md). Alert delivery remains `UNKNOWN`; measured minutes-scale detection remains `NO`; three-surface event-level symbolication remains `UNKNOWN`.
- No exact-release production error was returned in the searched 24-hour window. This is bounded query coverage, not exhaustive historical issue classification. Historical events/issues were not deleted or suppressed.
- The four owner-accepted financial gates remain unchanged. Production synthetic Support conversation/attachment records documented in earlier receipts remain untouched pending owner disposition.
- The next acceptance dependency is a bounded continuation over the remaining deployed Public/Admin journeys and current-release cross-surface message/realtime proof using the existing authorized identity. Restricted-role proof requires an existing authorized restricted identity. The owner must review the consolidated evidence before setting final acceptance.
