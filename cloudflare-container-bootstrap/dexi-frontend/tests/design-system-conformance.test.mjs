import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), 'utf8');
const chart = read('app/components/TradingChart.tsx');
const controls = read('app/components/NexiPrimitives.tsx');
const nav = read('app/components/BottomNav.tsx');
const css = read('app/globals.css');

assert.match(css, /\.nexi-shell-glass[\s\S]*backdrop-filter/);
assert.match(css, /\.nexi-raised-panel[\s\S]*backdrop-filter/);
assert.match(css, /\.nexi-execution-surface[\s\S]*background/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(controls, /disabled:opacity-40/);
assert.match(controls, /#6D41FF/);
assert.match(controls, /#9B55FF/);
assert.match(chart, /attributionLogo:\s*false/);
assert.match(chart, /horzTouchDrag:\s*true/);
assert.match(chart, /vertTouchDrag:\s*false/);
assert.match(chart, /pinch:\s*true/);
assert.match(nav, /h-\[60px\]/);
assert.match(nav, /max-w-\[420px\]/);
assert.match(nav, /rounded-\[18px\]/);
console.log('PPTX visual-system source conformance: PASS');
