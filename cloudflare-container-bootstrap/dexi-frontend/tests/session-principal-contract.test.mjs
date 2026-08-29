import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const adapter = await readFile(new URL('../app/lib/wallet-auth.ts', import.meta.url), 'utf8');
const ownershipConsumers = await Promise.all([
  'wallet',
  'mining',
  'loans',
  'profile',
  'settings',
  'messages',
].map((name) => readFile(new URL(`../app/dashboard/${name}/page.tsx`, import.meta.url), 'utf8')));

test('ownership-guarded consumers derive transport identity from the JWT subject', () => {
  assert.match(adapter, /export function sessionPrincipalId\(\): string \| null/);
  assert.match(adapter, /payload\.sub/);
  for (const source of ownershipConsumers) assert.match(source, /sessionPrincipalId/);
});
