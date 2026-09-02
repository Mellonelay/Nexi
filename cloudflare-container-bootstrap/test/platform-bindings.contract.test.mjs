import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

test('local Worker exposes bounded D1, queue, workflow, R2, KV, analytics and pipeline boundaries', () => {
  for (const host of ['nexi-core-d1', 'nexi.queue', 'nexi.workflow', 'nexi.r2', 'nexi.kv', 'nexi.analytics', 'nexi.pipeline']) {
    assert.match(source, new RegExp(`['\"]${host.replace('.', '\\.') }['\"]`));
  }
  assert.match(source, /CORE_DB\.prepare\("SELECT 1 AS ok"\)/);
  assert.match(source, /CORE_DB\.batch\(prepared\)/);
  assert.match(source, /queue\.send\(body\)/);
  assert.match(source, /workflow\.create\(\{ id: body\.id, params \}\)/);
  assert.match(source, /MARKET_ARCHIVE\.get\(key\)/);
  assert.match(source, /NEXI_CONFIG\.get\(key\)/);
  assert.match(source, /NEXI_ANALYTICS\.writeDataPoint/);
  assert.match(source, /stream\.send\(records\)/);
});

test('wrangler config retains the local platform bindings required by the proof boundary', () => {
  for (const binding of ['CORE_DB', 'DEPOSIT_PROOFS', 'MARKET_ARCHIVE', 'DOMAIN_EVENTS_QUEUE', 'NOTIFICATIONS_QUEUE', 'INTEGRATION_JOBS_QUEUE', 'WITHDRAWAL_WORKFLOW', 'MINING_WORKFLOW', 'LOAN_WORKFLOW', 'NEXI_ANALYTICS', 'NEXI_CONFIG', 'MARKET_STRUCTURED_STREAM', 'MARKET_ARCHIVE_STREAM', 'NEXI_PLATFORM_VALIDATION']) {
    assert.match(config, new RegExp(`["']binding["']\\s*:\\s*["']${binding}["']`));
  }
  assert.match(config, /["']name["']\s*:\s*["']NEXI_API_CONTAINER["']/);
});
