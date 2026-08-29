# NEXI Browser Acceptance Matrix

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Public browser coverage
All 11 routes at 320/360/390/430 mobile widths and representative tablet/desktop widths; navigation, safe areas, loading/live/stale/unavailable/disabled/error/maintenance states, keyboard/focus/accessibility, and no relevant console errors.

## Trading flow coverage
Dashboard category/favorite/search; Active Pair continuity Dashboard→Spot, Dashboard→Binary, Spot↔Binary and refresh; invalid/disabled pair; chart/feed degradation; Spot validation/order/history/cancel; Binary duration/payout/position/countdown/settlement states.

## Financial product coverage
Wallet domains and transaction flows; mining product/subscription/history; loan application/status/repayment; settings/KYC/security; negative authorization and unavailable backend states.

## Communications/content coverage
Support tickets/conversations, Messages unread/read/delivery, Announcement publish/read, Learn progress, notification behavior, attachment errors, and no simulated local responses.

## Admin coverage
Separate login/RBAC, each A1–A9 route, search/filter/pagination, permission denial, reason/confirmation, consequential actions in safe test mode, audit correlation, public propagation, and environment/sandbox labels.

## Evidence
Named screenshots, browser viewport, route, state, user/role, timestamp, console summary, relevant network request/response schema, and pass/block decision.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
