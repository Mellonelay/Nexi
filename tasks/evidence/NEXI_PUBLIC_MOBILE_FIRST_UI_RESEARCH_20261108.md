# NEXI Public — Mobile-first UI Engineering Research and Read-only Source Audit

**Research date:** 2026-11-08\
**Scope:** NEXI Public mobile-first responsive web application; Next.js 16.4.1, React 19.3.0, Tailwind CSS 3.x, Geist and Lucide React.\
**Source evidence:** `Mellonelay/Nexi` `main` at `2fbc1538ea456d13d7c05b7efd38d2f0050a83ba` when inspected. VM has three unrelated tracked task/evidence edits; no frontend changes made by this research.\
**Method:** Exa and official-source searches, Context7 library documentation, read-only SentinelX repository inspection, GitHub file corroboration, visual observations supplied by owner. Parallel Search returned substantive results; subsequent Parallel Research/Fetch returned HTTP 402 insufficient credits and did not produce a report. **No browser execution, screenshots, build, or visual measurement was performed during this audit.**

## Executive conclusion

NEXI has an established design identity and fairly complete documented mobile-first intent. Its failure is chiefly **implementation discipline at shared responsive primitives and content-size boundaries**, not an absence of a cryptocurrency UI kit. The clearest example is the shared `Metric` primitive that sets `truncate` on financially meaningful strings while the Wallet Summary forces three equally sized cards into every phone width. This directly predicts the owner's observed `5,000.00...` truncation. Likewise, the Wallet asset presentation forces four narrow columns and ellipsizes prices, while presenting a backend/account state as `Account not opened` for discoverable assets. A typography-only fix will not solve intrinsic layout constraints or semantic model conflation.

Recommended direction: preserve `frontend/DESIGN.md` visual authority, create an enforceable **NEXI Mobile Layout Contract** at shared primitives and per-surface adaptations, and implement only after the current interactive-acceptance Phase A is complete. Validate by actual mobile screenshots and viewport-specific interaction rather than source/static analysis alone.

## Reference validation: which sources to trust

| Reference | Status and relevance | How to use |
|---|---|---|
| [NEXI `frontend/DESIGN.md`](https://github.com/Mellonelay/Nexi/blob/main/frontend/DESIGN.md) | **Current local design authority**. Defines color, Geist font, typography targets, spacing, shell, five dock destinations, 320/360/~390/430px support, Wallet hierarchy and accepted visual references. | Governs product identity; new recommendations adapt rather than override it. |
| [Coinbase Design System](https://cds.coinbase.com/) / [GitHub](https://github.com/coinbase/cds) / [Data Table guidance](https://cds.coinbase.com/components/data-display/Table) | **Primary industry design system** with actual web React implementation; explicitly recommends mobile list views instead of complex desktop tables. | Structural patterns, accessible components, data-list behavior. Do not copy brand or assume app adoption of library. |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) / [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | **Normative accessibility source**: reflow at 320 CSS px for ordinary vertical content; 200% text resize; min target size WCAG 2.2 AA 24×24px with exceptions. | Required acceptance tests, accessibility, zoom behavior. A larger 44×44px operational touch target is a NEXI design decision, not the WCAG AA minimum. |
| [MDN `min-width`](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width) | **Primary CSS reference**: flex/grid item automatic minimum sizes can prevent shrinkage. | Understand `min-w-0`, intrinsic min-content, minmax(0,1fr), content wrapping. Do not fix clipping by adding `overflow-hidden` to every ancestor. |
| [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design) and [Font Variant Numeric](https://tailwindcss.com/docs/font-variant-numeric) | **Official framework contract**; unprefixed utilities are mobile baseline; `sm:` applies at ≥640px for Tailwind v3 default. `tabular-nums` stabilizes digit advances. | Implement mobile-first, responsive layout and live ticker stability. `tabular-nums` does **not** prevent long values from being truncated. |
| [Next.js fonts](https://nextjs.org/docs/app/getting-started/fonts) | **Official framework guidance**; `next/font`/Geist optimizes loading and reduces font-related layout changes. | Preserve NEXI font authority and verify existing font setup; don't add another font stack. |
| [shadcn/ui](https://ui.shadcn.com/) | **Accessible source-code component patterns**; responsive mobile Drawer vs desktop Dialog example, tabs and scroll areas. | Adapt patterns if current NEXI primitives are deficient. No wholesale UI-library migration. |
| [Material Design 3 navigation bar](https://m3.material.io/components/navigation-bar/guidelines) | **Authoritative mobile navigation pattern**: three to five top-level destinations with icons and labels, stable bottom bar. | NEXI's five-destination dock is already well aligned. Preserve exact accepted destinations. |
| [FrontDEX Figma](https://www.figma.com/community/file/1081520624421222872/crypto-trading-ui-kit-frontdex-4-0-0-alpha-3) | **Design-kit reference** describing >40 screens and >100 elements, React and mobile/desktop designs. | Interaction ideas only; not a normative or current code dependency. Respect licensing and avoid bulk copying. |
| [Jonas Przysucha's Binance heuristic case study](https://medium.com/@jonasprzysucha/case-study-redesigning-binanceapp-using-heuristics-analysis-ba824764daa0) (2024-05-05) | **Individual UX case study**, not Binance's official design system. Focuses on reducing clutter, better token identification, consolidating trading, and simplifying header. | Supports clearer hierarchy, icons+full names, trading-first use. Not evidence for exact font or pixel values. |
| [UX Pilot crypto exchange template](https://uxpilot.ai/mobile-design-templates/crypto-exchange-ui), [Uizard crypto app](https://uizard.io/templates/mobile-app-templates/crypto-nft-mobile-app/) | **Template marketing/inspiration**, not engineering standards or verified NEXI-fit patterns. | Optional flow ideation only; low evidentiary weight. |
| Vercel Geist design / Dribbble / purported “Binance 2.0 spacing overhaul” | Geist style has established primary product references; named “Binance 2.0 overhaul” was not verified as a specific authoritative source in this research. Dribbble is gallery inspiration only. | Do not invent or elevate undocumented ratios and spacing rules into requirements. |

## Source-level findings, ordered by impact

### P1 — Financial information truncated in shared `Metric` primitive

- `frontend/app/components/PagePrimitives.tsx:94–95` renders a padded (`p-4`) metric and applies **`truncate`** to its `text-lg` financial value. The component has no intrinsic accommodation for multi-segment values.
- `frontend/app/dashboard/wallet/page.tsx:248–260` places Available, Locked and Total into **`grid-cols-3` unconditionally** with `gap-2` and displays values from `estimatePortfolio`, which may include a `USDT` suffix and `· N unpriced` qualifier. On a narrow viewport, each cell cannot accommodate the content.
- Owner-supplied screenshot shows `5,000.00...` and earlier `51,70...` in three cards, consistent with the rules above. **Root-cause assessment:** fixed columns + long value + ellipsis; not simply font size. Rendering measurement still needed.
- **Correction contract:** use mobile one-column total prominently and two-column or stacked Available/Locked if content fits; use adaptive grid by available width, e.g. `grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3` with an explicit full-width Total on narrow screens. Never ellipsize monetary amounts. Separate value, currency unit, and valuation caveats, format with appropriate source precision, and permit wrapping or details when extreme precision/amounts occur.

### P1 — Wallet asset rows structurally too narrow for small screens

- `frontend/app/dashboard/wallet/page.tsx:270–271` uses `grid-cols-[minmax(3rem,1fr)_repeat(3,minmax(3rem,auto))]` and **`truncate`** on all numeric fields plus asset label, forcing Asset / Available / Locked / Total into one mobile row. `frontend/app/dashboard/wallet/page.tsx:293–294` repeats the same four-column header structure.
- **Correction contract:** on mobile, represent each asset as a list item with asset icon/name/symbol, full available and total values, and secondary locked/committed detail below or behind accessible expansion. Use a desktop table only when sufficient real width is available. For 54 candidate assets, provide search/filter and scroll without forcing every row into the first viewport.
- Preserve numeric precision and align figures with `font-variant-numeric: tabular-nums`, but do not equate that feature with content fitting.

### P1 — Unsupported/wallet-held/tradable statuses conflated

- `frontend/app/dashboard/wallet/page.tsx:45–69` assembles displayed assets from wallet overview and configured currencies. `:270–271` says `Account not opened` if there are no ledger scope balances. This is a **source-confirmed copy/semantics issue** compared with the owner's target behavior, not proof that a backend account is actually required for each asset.
- Owner target: Overview discovers the 53 markets + USDT, Funding presents enabled deposit assets, Spot presents tradable asset holdings, Margin/Options/Finance are USDT-focused.
- **Correction contract:** separate catalog visibility, deposit support, actual held balance and scope ledger existence. Display zero balance where backend supports a genuine zero state, and unavailability where custody is not supported. For stocks/FX/metals, market quote availability must not be misrepresented as custodial wallet ownership. Actual asset count and deposit-network availability remain backend-owned.

### P2 — Category selector and six scope tabs need bounded responsive organization

- `frontend/app/dashboard/wallet/page.tsx:293–294` already contains a native select with All/Crypto/Stocks/Metals/Forex; it is **not absent**. This is a usability/placement/readback issue, not necessarily a missing implementation.
- `:284–285` has a six-button horizontal tab rail with overflow-x-auto: **appropriate bounded scrolling** if selected tab stays visible, labels aren't cut off, and the overall page does not horizontally scroll.
- **Correction contract:** asset category control must remain visible/operable and honor market catalog classification; choose visible default category thoughtfully; don't duplicate Dashboard category terminology without backend ownership. Confirm category changes filter true relevant rows, not create fictitious balances.

### P2 — Dense small typography and consistency concerns

- `frontend/DESIGN.md:136–152` targets Geist with display 48/52, heading 24/30 and 20/26, body 14/21, label 11/16, data 14/20. Existing wallet has `text-[9px]` headers, `text-[10px]` captions and `text-xs` financial values under narrow layouts (`page.tsx:293–294`, `:248–260`).
- **Correction contract:** use named semantic roles and appropriate information priorities. Suggested NEXI implementation targets (not WCAG-mandated values): page 22–24/28–30; section 18–20/24–26; body 14–16/20–24; primary financial amount 22–28/28–34; asset row name 14–16; metadata 12–13 when contrast remains sufficient; avoid 9–10px critical financial labels. Validate at 200% text resize and real hardware rather than insisting one universal typography scale.

### Positive existing implementation to preserve

- NEXI already has CSS color/shape tokens and Geist mapped through Tailwind; no reason to clone Coinbase/CDS or migrate Tailwind.
- `frontend/DESIGN.md:196–212` fixes **exactly five** mobile dock destinations—Dashboard, Spot/Margin, Options, Wallet, Earn—consistent with Material 3's general 3–5 guidance.
- `frontend/app/dashboard/layout.tsx:15–30` has mobile-first stacked shell with desktop sidebar from `lg`, and bounded main overflow. CSS has mobile safe-area and bounded horizontal rail rules.
- `frontend/app/dashboard/wallet/page.tsx:279–281` quick action buttons have height ≥64px, consistent with usable touch target height, although width and label behavior still require rendered review.
- `:293–294` includes category selector; `:284–285` includes a scoped scroll rail. Avoid reimplementing existing controls.

## Proposed NEXI Public Mobile Layout Contract

| System | Recommendation / measurable acceptance |
|---|---|
| Viewports | Primary test widths **320, 360, 390, 412, 430 CSS px**, short-height mobile, tablet and desktop. Cover 200% text zoom and WCAG-equivalent 320px reflow/400% zoom. Rendered proof needed. |
| Global width | No persistent document-level horizontal scroll or clipped actionable content; bounded chart/tab/ticker rails may scroll horizontally when necessary and visibly signaled. |
| Layout grids | Default to content-first single column on narrow screens; use two+ columns only if actual content measures and retains legibility. `min-w-0` and `minmax(0,1fr)` help with intrinsic sizes but **do not justify clipping**. |
| Money and balances | Never apply ellipsis or hidden overflow to critical prices, stake, return, available, locked, total, commissions or settlement result. Right-align tabular digits in lists; full source-decimal precision available on demand. Separate token labels/units from values. Don't change rounding/accounting logic while adjusting display. |
| Type | Preserve Geist sans/mono, create documented role tokens, limit letter spacing on dense financial labels, avoid critical 9–10px text, verify text resize and localization. |
| Spacing | Preserve existing radius family (8/12/16/20/24) and shared spacing tokens; suggested 4px increment scale with 8/12px row gaps and 12–16px phone gutters (tune against current accepted reference). These are *design proposals*, not external mandatory standards. |
| Touch | NEXI target ~**44×44 CSS px** for primary interactive targets. WCAG 2.2 AA criterion 2.5.8 is ≥24×24px with exceptions; do not confuse these standards. |
| Bottom dock | Keep five fixed top-level destinations, icons+labels+selected indicator, safe-area insets, scroll/padding clearance and no overlay of trade confirm buttons. |
| Trading | Chart remains dominant; ticket and chart should stack at narrow widths; no hidden essential stake/duration/payout. Confirm modal must show all high-stakes values clearly; countdown should be live and synchronized with authoritative expiry. Do not reinterpret settlement failure as a visual-only issue. |
| Assets & markets | Use list/cards for mobile asset rows and a detailed desktop grid where appropriate; show full name, ticker, icon, holdings, market category and deposit support as distinct facts. Zero vs unavailable vs unsupported vs unpriced are different states. |
| Forms & sheets | Mobile bottom sheet or full-height drawer, internally scrollable content, safe-area padded footer, visible field labels/errors and confirmation controls. Use current primitives when sufficient; shadcn/Radix are optional reference patterns. |
| A11y and states | Visible focus, logical keyboard order, contrast WCAG AA (generally 4.5:1 normal text and 3:1 large text), reduced motion, loading/empty/error/retry, dynamic data status that does not cause layout jumping, labels not color-only. |
| Source proof vs visual proof | Source-level repairs can be located without device testing. Completion requires one bounded mobile viewport pass + targeted screenshot/interaction checks against the actual app after the coordinated repair/deployment phase. |

## Smallest correct implementation approach (after acceptance Phase A)

1. **Start at `Metric` and WalletSummary**: fix the shared financial-number geometry and ensure the primary total stays fully readable. Avoid globally removing `truncate` from unrelated navigational metadata.
2. **Introduce an adaptive WalletAssetList for narrow screens**, preserving desktop table where appropriate and maintaining asset/account semantics. Do not fake catalog holdings.
3. **Extract a focused semantic financial type/spacing contract** from existing `frontend/DESIGN.md` and actual current components; do not rebrand, adopt an entire new UI library, or redesign all pages at once.
4. Apply the contract to **Quotes Hub, Asset Detail, Spot/Margin, Options/Binary, Wallet, Earn, Loans, messages and modals** by direct visible defects, not speculative global CSS rewrites. Use the 113-case evidence as the priority backlog.
5. In a **separate viewport/device lane** (Work Cloud Browser lacks DevTools mobile emulation), check 320/360/390/412/430px, short height, 200% text resizing, and current accepted screenshots. One consolidated repair batch and one release after the existing interactive acceptance campaign finishes.

## Verification and authority limits

**Confirmed from source:** hardcoded three-column WalletSummary, `truncate` in shared Metric, compact four-column asset layout, existing native asset category filter, scope tabs, five-dock design authority, Next/React/Tailwind dependencies.

**Assessment:** those layout rules causally explain observed number clipping and are likely systemic for long financial values. Content reflow, typographic and component-level changes are warranted.

**Not established:** current browser CSS pixel dimensions, effect of 200% zoom, all screen-level font sizes, true catalog-to-wallet asset semantics, latest runtime account status, actual user test results, whether all 113 acceptance criteria were completed. No preview/visual detector was executed; do not invent an Impeccable 0–20 audit score or claim UI browser verification.

**Repository ownership:** Current `main` checked read-only, three modified tracked task/evidence files pre-existed; no writes or deployments performed.
