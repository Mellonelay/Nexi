import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual parser and read coordinator with controlled API responses.
const source = readFileSync(new URL('../app/dashboard/wallet/page.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source + '\nexport { readActivities, loadWalletData };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
let get;
const sandbox = { exports: {}, require: (name) => name === '../../lib/api' ? { default: { get: (...args) => get(...args) } } : {} };
vm.runInNewContext(compiled, sandbox);
const { readActivities, loadWalletData } = sandbox.exports;
const valid = { id: 'activity-1', ledgerPostingId: 'posting-1', asset: 'ETH', amount: '1' };

test('successful explicit empty collection is empty', () => {
  assert.equal(readActivities([]).length, 0);
  assert.equal(readActivities({ activities: [] }).length, 0);
});

test('successful HTTP response without an activity collection is unavailable', () => {
  for (const payload of [null, undefined, {}, { data: [] }, { activities: null }, { activities: {} }]) {
    assert.throws(() => readActivities(payload), /Wallet activity/);
  }
});

test('nonempty invalid ledger rows never masquerade as an empty collection', () => {
  for (const payload of [[{}], [{ id: 'activity-1' }], [{ id: ' ', ledgerId: 'posting-1' }], [null]]) {
    assert.throws(() => readActivities(payload), /Wallet activity/);
  }
  assert.throws(() => readActivities([valid, {}]), /ledger identity/);
});

test('ledger-backed activity retains real identity and values', () => {
  const result = readActivities({ activities: [valid] });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'activity-1');
  assert.equal(result[0].ledgerId, 'posting-1');
  assert.equal(result[0].asset, 'ETH');
  assert.equal(result[0].amount, '1');
});


test('activity rejection preserves successful wallet authority', async () => {
  const balances = { ETH: { available: '2', locked: '1', total: '3' } };
  get = async (endpoint) => {
    if (endpoint === '/wallet/me') return { data: balances };
    throw new Error('Activity unavailable');
  };
  const [wallet, activity] = await loadWalletData('/wallet/me', '/wallet/activity');
  assert.equal(wallet.state, 'LIVE');
  assert.equal(wallet.data, balances);
  assert.equal(activity.state, 'ERROR');
  assert.equal(activity.data, null);
});

test('successful malformed activity does not clear balances or become EMPTY', async () => {
  const balances = { ETH: '3' };
  for (const payload of [{}, { activities: null }, [{}], [valid, {}]]) {
    get = async (endpoint) => ({ data: endpoint === '/wallet/me' ? balances : payload });
    const [wallet, activity] = await loadWalletData('/wallet/me', '/wallet/activity');
    assert.equal(wallet.state, 'LIVE');
    assert.equal(wallet.data, balances);
    assert.equal(activity.state, 'ERROR');
    assert.equal(activity.data, null);
  }
});

test('only successful explicit empty activity produces LIVE empty data', async () => {
  for (const payload of [[], { activities: [] }]) {
    get = async (endpoint) => ({ data: endpoint === '/wallet/me' ? { ETH: '3' } : payload });
    const [wallet, activity] = await loadWalletData('/wallet/me', '/wallet/activity');
    assert.equal(wallet.state, 'LIVE');
    assert.equal(activity.state, 'LIVE');
    assert.equal(activity.data.length, 0);
  }
});

test('wallet failure does not revoke successful ledger activity', async () => {
  get = async (endpoint) => {
    if (endpoint === '/wallet/activity') return { data: [valid] };
    throw new Error('Balances unavailable');
  };
  const [wallet, activity] = await loadWalletData('/wallet/me', '/wallet/activity');
  assert.equal(wallet.state, 'ERROR');
  assert.equal(wallet.data, null);
  assert.equal(activity.state, 'LIVE');
  assert.equal(activity.data[0].id, valid.id);
  assert.equal(activity.data[0].ledgerId, valid.ledgerPostingId);
});
