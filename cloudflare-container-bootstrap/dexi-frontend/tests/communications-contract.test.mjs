import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const page = readFileSync(new URL('../app/dashboard/messages/page.tsx', import.meta.url), 'utf8');
const openapi = readFileSync(new URL('../../../work/20260806-api-foundation/openapi.yaml', import.meta.url), 'utf8');
assert.match(page, /const messageEndpoint = .*'\/communications\/messages'/);
assert.match(page, /api\.post\('\/communications\/messages'/);
assert.match(page, /idempotencyKey/);
for (const route of ['/communications/messages:', '/communications/announcements:', '/communications/notifications:', '/communications/notifications/{id}/read:']) assert.match(openapi, new RegExp(route.replace(/[{}\/]/g, '\\$&')));
console.log('communications contract source reconciliation: PASS');
