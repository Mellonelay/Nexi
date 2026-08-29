# NEXI Dashboard Fidelity Ledger — 2026-07-30

## Authorities

- Accepted concept: original `Quotes Hub` mobile PNG, 941 × 1672 image pixels.
- Logical comparison viewport: 390 × 844 CSS pixels in Google Chrome.
- Editable foundation source: copied Figma `NEXI Foundations Canvas` CSS.
- Production implementation: `cloudflare-container-bootstrap/dexi-frontend`.

## Comparison and repairs

| Area | Concept evidence | Previous render | Durable source repair |
|---|---|---|---|
| First viewport | Header, title, pair card, tabs, six rows, promo and dock all visible | Full-page render was 1450px tall | Compressed mobile geometry to one 844px viewport |
| Title and pair | One-line `Quotes Hub` beside BTC/USDT | Title stacked above oversized pair card | Two-column mobile hero and compact pair anatomy |
| Market density | Six compact rows with cyan sparklines | 78px rows and excess gaps | 58px rows, 1.5 spacing, responsive 36px token marks |
| Material palette | Cold black-purple, exact violet/cyan accents | Mixed inferred and Figma colors | Reconciled exact Figma accents/text with cold image-derived atmosphere |
| Promo and navigation | Compact promo followed by five-item dock | 190px promo and oversized dock | 108px promo, compact artwork, 64px fixed dock |

## Copy and behavior

- Above-the-fold copy preserved: `NEXI`, `Quotes Hub`, `Real-time markets. Precision insights.`, market categories, asset labels, promo copy and navigation labels.
- No new market claims, prices or authoritative values were introduced.
- Six visible mobile instruments remain backend-safe placeholders when market authority is unavailable.
- Asset selection, tabs, active-pair propagation and route navigation remain functional.

## Verification targets

- `390 × 844`: reference mobile composition and fixed dock.
- `1440 × 1000`: existing desktop terminal composition.
- Browser: installed Google Chrome through Playwright.
- Screenshot: `test-results/dashboard-reference-mobile-390x844.png`.

## Remaining intentional deviations

- Promo planet/histogram are lightweight local vector artwork rather than the raster illustration in the generated concept.
- The original image is generative artwork, so sub-pixel reconstruction is evaluated optically rather than by DOM metadata.
- Backend-owned market values remain unavailable placeholders until the approved backend supplies authoritative data.
