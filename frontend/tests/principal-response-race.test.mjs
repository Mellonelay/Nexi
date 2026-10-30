import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function callbacks(domain, get) {
  const source = ts.createSourceFile('page.tsx', readFileSync(new URL(`../app/dashboard/${domain}/page.tsx`, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const functions = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ['load', 'sync'].includes(node.name.getText(source))) {
      const value = node.initializer;
      functions[node.name.getText(source)] = (ts.isCallExpression(value) ? value.arguments[0] : value).getText(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  let principal = 'user-a';
  const writes = [];
  const context = {
    exports: {}, api: { get }, userId: 'user-a', sessionChecked: true,
    plansEndpoint: '/mining/plans', positionsEndpoint: '/mining/my/user-a', backendConfigured: true,
    previousUserId: { current: 'user-a' }, sessionPrincipalId: () => principal,
  };
  for (const setter of `${functions.load} ${functions.sync}`.match(/\bset[A-Z]\w+/g)) {
    context[setter] = (value) => writes.push({ setter, value });
  }
  vm.runInNewContext(ts.transpileModule(`exports.load = ${functions.load}; exports.sync = ${functions.sync};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  return { ...context.exports, writes, switchPrincipal: (next) => { principal = next; } };
}

for (const domain of ['mining', 'loans']) {
  for (const outcome of ['success', 'failure']) {
    test(`${domain} ignores a delayed ${outcome} from the previous principal`, async () => {
      const started = Promise.withResolvers();
      const pending = Promise.withResolvers();
      const client = callbacks(domain, (endpoint) => {
        if (endpoint.endsWith('/plans')) return Promise.resolve({ data: [] });
        started.resolve();
        return pending.promise;
      });
      const loading = client.load();
      await started.promise;
      client.switchPrincipal('user-b');
      const previousWrites = client.writes.length;
      if (outcome === 'success') pending.resolve({ data: [{ id: 'private-user-a-record' }] });
      else pending.reject(new Error('Old request failed'));
      await loading;
      assert.equal(client.writes.length, previousWrites, 'A prior principal cannot overwrite current private data or status');
    });
  }

  test(`${domain} accepts a response for the unchanged principal`, async () => {
    const client = callbacks(domain, async (endpoint) => ({ data: endpoint.endsWith('/plans') ? [] : [{ id: 'owned-record' }] }));
    await client.load();
    const result = client.writes.find(({ setter }) => setter === (domain === 'mining' ? 'setPositions' : 'setLoans'));
    assert.equal(result.value[0].id, 'owned-record');
  });

  test(`${domain} clears private snapshots immediately on logout`, () => {
    const client = callbacks(domain, () => { throw new Error('Unexpected request'); });
    client.switchPrincipal(null);
    client.sync();
    const result = client.writes.find(({ setter }) => setter === (domain === 'mining' ? 'setPositions' : 'setLoans'));
    assert.equal(result.value.length, 0);
    if (domain === 'mining') {
      assert.equal(client.writes.find(({ setter }) => setter === 'setSummary').value, null);
      assert.equal(client.writes.find(({ setter }) => setter === 'setRewards').value.length, 0);
    } else {
      assert.equal(client.writes.find(({ setter }) => setter === 'setRepaymentLoanId').value, null);
      assert.equal(client.writes.find(({ setter }) => setter === 'setRepaymentAmount').value, '');
    }
    const state = client.writes.find(({ setter }) => setter === (domain === 'mining' ? 'setPositionState' : 'setState'));
    assert.equal(state.value, 'UNAVAILABLE');
  });
}

test('binary clears private snapshots when the wallet principal changes', () => {
  const source = ts.createSourceFile('binary.tsx', readFileSync(new URL('../app/dashboard/binary/page.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let sync;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'sync') sync = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(sync, 'Binary session sync callback exists');

  let principal = 'user-b';
  const writes = [];
  const context = {
    exports: {},
    previousUserId: { current: 'user-a' },
    sessionPrincipalId: () => principal,
  };
  for (const name of ['setActivePositions', 'setHistory', 'setSelectedResult', 'setSelectedChartTradeId', 'setOptionWalletBalanceResult', 'setConfirmationOpen', 'setState', 'setUserId']) {
    context[name] = (value) => writes.push({ name, value });
  }
  vm.runInNewContext(ts.transpileModule(`exports.sync = ${sync};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText, context);

  context.exports.sync();
  assert.deepEqual(writes.slice(0, 7).map(({ name, value }) => [name, Array.isArray(value) ? Array.from(value) : value]), [
    ['setActivePositions', []], ['setHistory', []], ['setSelectedResult', null],
    ['setSelectedChartTradeId', null], ['setOptionWalletBalanceResult', null],
    ['setConfirmationOpen', false], ['setState', 'DRAFT'],
  ]);
  assert.deepEqual(writes.at(-1), { name: 'setUserId', value: 'user-b' });
});
