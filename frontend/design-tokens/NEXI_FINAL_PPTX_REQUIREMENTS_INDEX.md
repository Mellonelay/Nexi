# NEXI Final PPTX Requirements Index

**Source:** `C:\Users\mello\Downloads\Nexi Design System (final).pptx` (12 slides, 714 embedded media items, parsed 2026-08-11).

This index is a traceability companion, not a replacement for the byte-identical visual authorities (`DESIGN.md`, `.stitch\DESIGN.md`, and `docs\design\NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`). Current source and the program charter resolve conflicts.

| PPTX concern | Canonical source / status | Action in this slice |
|---|---|---|
| 17 Deep Liquid Violet tokens | `app/globals.css` | Retain |
| Shell, raised, execution surfaces | `NexiPrimitives.tsx`, `globals.css` | Retain |
| Reduced-motion guarded feedback, ripple, press | `globals.css`, `nexi-motion.ts` | Retain |
| Button min-height, state glow, disabled state | `NexiPrimitives.tsx` | Reconcile exact primary token and disabled opacity |
| Asset logos and deterministic fallback | `AssetIcon.tsx`, `asset-registry.ts` | Retain; current canonical asset registry wins over PPTX asset list |
| Kline palette/grid/crosshair | `TradingChart.tsx` | Retain |
| TradingView attribution absent | `TradingChart.tsx` | Make the configured absence explicit |
| Chart touch drag/pinch | `TradingChart.tsx` | Add explicit approved options |
| Responsive safe areas/mobile dock | `BottomNav.tsx`, `globals.css`, `layout.tsx` | Reconcile bottom-nav desktop/mobile geometry |
| Typography | `globals.css`, `TradingChart.tsx` | Retain Geist Mono; current NEXI authority supersedes PPTX IBM Plex Mono suggestion |
| 53 assets | Backend catalog / `asset-registry.ts` | Retain; do not import PPTX's incompatible asset composition |
| WebSocket delivery target | backend + `useRealtimeMarket.ts` | Outside this visual-only slice; existing integration retained |

## Deliberate non-claims

- This is source/static conformance only; screenshots, motion, touch and browser behavior remain unverified.
- PPTX slide 12 is a handoff assertion and is not proof that isolated Linux source overwrote the Windows authority.
