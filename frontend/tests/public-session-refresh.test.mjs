import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import axios from 'axios';
import ts from 'typescript';

function client(adapter) {
  const context = vm.createContext({
    window: { location: { hostname: 'www.nexitrading.app' }, dispatchEvent() {} },
    CustomEvent,
    atob,
    process: { env: { NODE_ENV: 'production' } },
  });
  function load(path, require) {
    context.exports = {};
    context.require = require;
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    vm.runInContext(ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText, context);
    return context.exports;
  }
  const session = load('../app/lib/auth-session.ts');
  const module = load('../app/lib/api.ts', (name) => name === './auth-session' ? session : {
    ...axios,
    create: (config) => axios.create({ ...config, adapter }),
  });
  return { api: module.default, recover: module.recoverPublicSession, session };
}

function response(config, data) {
  return { status: 200, statusText: 'OK', headers: {}, config, data };
}

function unauthorized(config) {
  return new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    ...response(config, {}), status: 401,
  });
}

test('rejected access token refreshes through the cookie and retries the same intent once', async () => {
  let refreshes = 0;
  const attempts = [];
  const { api, session } = client(async (config) => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      assert.equal(config.withCredentials, true);
      assert.equal(config.headers.get('Authorization'), undefined);
      return response(config, { access_token: 'renewed' });
    }
    attempts.push({ token: config.headers.get('Authorization'), data: config.data });
    if (attempts.length === 1) throw unauthorized(config);
    return response(config, { accepted: true });
  });
  session.setAuthSession({ access_token: 'expired' });
  const result = await api.post('/spot/order', { idempotencyKey: 'intent-1' });
  assert.equal(result.data.accepted, true);
  assert.equal(refreshes, 1);
  assert.deepEqual(attempts.map((attempt) => attempt.token), ['Bearer expired', 'Bearer renewed']);
  assert.equal(attempts[0].data, attempts[1].data);
});

test('startup recovery keeps an existing session without rotating it', async () => {
  const { recover, session } = client(() => { throw new Error('Unexpected request'); });
  session.setAuthSession({ access_token: 'current' });
  assert.equal(await recover(), true);
  assert.equal(session.getAccessToken(), 'current');
});

test('concurrent and late rejected responses share the renewed session', async () => {
  let refreshes = 0;
  let finishRefresh;
  let rejectLate;
  const refreshStarted = Promise.withResolvers();
  const lateStarted = Promise.withResolvers();
  const { api, session } = client(async (config) => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      refreshStarted.resolve();
      await new Promise((resolve) => { finishRefresh = resolve; });
      return response(config, { access_token: 'renewed' });
    }
    if (config.headers.get('Authorization') === 'Bearer expired') {
      if (config.url === '/late') {
        lateStarted.resolve();
        await new Promise((resolve) => { rejectLate = resolve; });
      }
      throw unauthorized(config);
    }
    return response(config, 'ok');
  });
  session.setAuthSession({ access_token: 'expired' });
  const first = api.get('/first');
  const second = api.get('/second');
  const late = api.get('/late');
  await Promise.all([refreshStarted.promise, lateStarted.promise]);
  finishRefresh();
  await Promise.all([first, second]);
  rejectLate();
  assert.equal((await late).data, 'ok');
  assert.equal(refreshes, 1);
});

test('a delayed 401 from another principal is not replayed under the current wallet', async () => {
  let protectedAttempts = 0;
  let refreshes = 0;
  let rejectRequest;
  const started = Promise.withResolvers();
  const { api, session } = client(async (config) => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      return response(config, { access_token: 'refreshed-user-b' });
    }
    protectedAttempts++;
    started.resolve();
    await new Promise((resolve) => { rejectRequest = resolve; });
    throw unauthorized(config);
  });
  const token = (sub) => `header.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.signature`;
  session.setAuthSession({ access_token: token('user-a'), user: { id: 'user-a' } });
  const request = api.post('/mining/subscribe', { idempotencyKey: 'intent-a' });
  await started.promise;
  session.setAuthSession({ access_token: token('user-b'), user: { id: 'user-b' } });
  rejectRequest();
  await assert.rejects(request, { status: 401 });
  assert.equal(protectedAttempts, 1);
  assert.equal(refreshes, 0);
});

test('a successful response from a previous principal is cancelled before it reaches callers', async () => {
  let complete;
  const started = Promise.withResolvers();
  const { api, session } = client((config) => new Promise((resolve) => {
    started.resolve();
    complete = () => resolve(response(config, { privateData: 'user-a' }));
  }));
  const token = (sub) => `header.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.signature`;
  session.setAuthSession({ access_token: token('user-a'), user: { id: 'user-a' } });
  const request = api.get('/wallet/overview');
  await started.promise;
  session.setAuthSession({ access_token: token('user-b'), user: { id: 'user-b' } });
  complete();
  await assert.rejects(request, { code: 'ERR_CANCELED' });
});

test('failed refresh clears the rejected session and does not replay the protected request', async () => {
  let protectedAttempts = 0;
  const { api, session } = client(async (config) => {
    if (config.url !== '/auth/refresh') protectedAttempts++;
    throw unauthorized(config);
  });
  session.setAuthSession({ access_token: 'expired', user: { id: 'user-1' } });
  await assert.rejects(api.get('/wallet/me'), { status: 401 });
  assert.equal(protectedAttempts, 1);
  assert.equal(session.getAccessToken(), null);
  assert.equal(session.getSessionUserId(), null);
});

test('a renewed token rejected again stops after one retry', async () => {
  let protectedAttempts = 0;
  let refreshes = 0;
  const { api, session } = client(async (config) => {
    if (config.url === '/auth/refresh') {
      refreshes++;
      return response(config, { access_token: 'renewed' });
    }
    protectedAttempts++;
    throw unauthorized(config);
  });
  session.setAuthSession({ access_token: 'expired' });
  await assert.rejects(api.get('/wallet/me'), { status: 401 });
  assert.equal(protectedAttempts, 2);
  assert.equal(refreshes, 1);
});
