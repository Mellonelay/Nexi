# NEXI Reference Visual Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the supplied NEXI screenshots as visual look-and-feel authority while preserving existing NEXI routes, state, labels, and financial-data boundaries.

**Architecture:** Keep existing React route ownership and shared navigation/state. Strengthen the existing Deep Liquid Violet token layer, then apply the same layered station language to Dashboard, Spot, and Binary without introducing new data or trading behavior.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, existing lucide-react icons, existing market and active-pair providers.

## Global Constraints

- Screenshots are visual authority only; do not copy their product behavior, data, labels, balances, prices, or trading mechanics.
- Preserve `/dashboard` as Quotes Hub, the five market tabs, shared Active Pair, left drawer, and five-item mobile navigation.
- Preserve safe placeholders and explicit unavailable states; do not fabricate financial truth.
- Do not add dependencies, change manifests, change lockfiles, deploy, mutate Stitch, or change backend code.
- Verify changed routes at 320, 360, 390, 430, 768, and 1440 pixels where practical.

### Task 1: Strengthen shared NEXI visual tokens

**Files:**
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\globals.css`
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\dashboard\layout.tsx`

- [x] Add reusable background, panel, border, glow, and data-text utilities using the existing Deep Liquid Violet palette.
- [x] Add safe-area and scrollbar treatment without changing document overflow behavior.
- [x] Apply the shell utility classes to the dashboard layout only.

### Task 2: Refine Dashboard visual presentation

**Files:**
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\dashboard\page.tsx`
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\components\BottomNav.tsx`
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\components\Sidebar.tsx`
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\components\NavigationDrawer.tsx`

- [x] Preserve all existing Dashboard data and interactions.
- [x] Align header, active-pair card, tabs, quote rows, and promotional panel to the supplied black/navy/violet surface hierarchy.
- [x] Keep all five tabs visible at supported narrow widths in source layout; browser proof remains pending.
- [x] Retain the fixed mobile navigation and left-side drawer, improving only depth, active treatment, and spacing.

### Task 3: Refine trading station chrome

**Files:**
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\dashboard\spot\page.tsx`
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\dashboard\binary\page.tsx`
- Modify: `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend\app\components\RealtimeTradingChart.tsx`

- [x] Preserve chart, order, duration, state, and API behavior.
- [x] Apply the reference station language: compact top market strip, layered chart panel, violet active tabs, disciplined cyan/green/red signals, and responsive card stacking.
- [x] Keep unavailable and fixture boundaries explicit.

### Task 4: Verify the bounded visual pass

**Files:**
- Test: existing frontend test scripts and TypeScript configuration; no new dependency or test framework.

- [x] Run focused type/build checks available in the existing package.
- [ ] Run a local browser pass for Dashboard, Spot, and Binary at required widths; blocked by Chromium GPU initialization.
- [x] Record the browser-runtime limitation and unresolved visual-verification gap.
- [x] Do not claim visual parity without direct browser evidence.
