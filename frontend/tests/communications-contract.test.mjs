import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const page = readFileSync(new URL('../app/dashboard/messages/page.tsx', import.meta.url), 'utf8');
const openapi = JSON.parse(readFileSync(new URL('../../docs/contracts/openapi.json', import.meta.url), 'utf8'));
assert.match(page, /const messageEndpoint = .*'\/communications\/messages'/);
assert.match(page, /const conversationEndpoint = .*'\/communications\/conversations'/);
assert.match(page, /api\.post\('\/communications\/messages'/);
assert.match(page, /idempotencyKey/);
for (const route of ['/communications/messages', '/communications/conversations', '/communications/conversations/{id}/report', '/communications/announcements', '/communications/learn', '/communications/learn/{slug}', '/communications/notifications', '/communications/notifications/{id}/read']) {
  assert.ok(openapi.paths?.[route], `missing OpenAPI path: ${route}`);
}
console.log('communications contract source reconciliation: PASS');
