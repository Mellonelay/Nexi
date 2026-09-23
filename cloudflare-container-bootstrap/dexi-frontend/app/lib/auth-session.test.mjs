import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const frontendRoot = new URL('../../', import.meta.url);

async function source(relativePath) {
  return readFile(new URL(relativePath, frontendRoot), 'utf8');
}

async function publicApplicationSources() {
  const files = [
    'app/layout.tsx',
    'app/login/page.tsx',
    'app/signup/page.tsx',
    'app/components/AccountIdentityHeader.tsx',
    'app/components/NotificationsPanel.tsx',
    'app/components/WalletAccessGate.tsx',
    'app/components/WalletConnectControl.tsx',
    'app/dashboard/binary/page.tsx',
    'app/dashboard/loans/page.tsx',
    'app/dashboard/messages/page.tsx',
    'app/dashboard/mining/page.tsx',
    'app/dashboard/settings/page.tsx',
    'app/dashboard/spot/page.tsx',
    'app/dashboard/wallet/page.tsx',
    'app/dashboard/wallet/components/DepositModal.tsx',
    'app/lib/api.ts',
    'app/lib/auth-session.ts',
    'app/lib/wallet-auth.ts',
    'app/state/LocaleProvider.tsx',
  ];
  return Promise.all(files.map(async (file) => [file, await source(file)]));
}

test('public auth never persists access or refresh tokens in browser storage', async () => {
  const sources = await publicApplicationSources();
  const browserTokenStorage = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*['"](?:token|access_token|refresh_token|accessToken|refreshToken)['"]/i;

  for (const [file, contents] of sources) {
    assert.doesNotMatch(contents, browserTokenStorage, `${file} must not use browser storage for auth tokens`);
  }
});

test('API authorization uses credentials and recovers through the HttpOnly cookie refresh endpoint', async () => {
  const api = await source('app/lib/api.ts');

  assert.match(api, /getAccessToken/);
  assert.match(api, /Authorization\s*=\s*`Bearer \$\{token\}`/);
  assert.match(api, /['"]\/auth\/refresh['"]/);
  assert.match(api, /withCredentials:\s*true/);
  assert.doesNotMatch(api, /getRefreshToken|refreshToken\s*\}/);
  assert.match(api, /setAuthSession\(response\.data\)/);
  assert.match(api, /config\._nexiAuthRetry/);
});

test('session cleanup clears both in-memory credentials and the public user snapshot', async () => {
  const session = await source('app/lib/auth-session.ts');
  const walletAuth = await source('app/lib/wallet-auth.ts');
  const settings = await source('app/dashboard/settings/page.tsx');

  assert.match(session, /accessToken\s*=\s*null/);
  assert.doesNotMatch(session, /refreshToken/);
  assert.match(session, /sessionUser\s*=\s*null/);
  assert.match(walletAuth, /clearWalletSession[\s\S]*clearAuthSession/);
  assert.match(walletAuth, /api\.post\(['"]\/auth\/logout['"]\)/);
  assert.match(settings, /api\.post\(['"]\/auth\/logout-all['"]\)/);
  assert.match(settings, /clearWalletSession\(\)/);
});

test('in-memory session runtime stores and clears only the access token without browser storage', async () => {
  const session = await import('./auth-session.ts');
  const previousWindow = globalThis.window;
  const events = [];
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };

  try {
    session.setAuthSession({ access_token: 'access-test', user: { id: 'user-test' } });
    assert.equal(session.getAccessToken(), 'access-test');
    assert.equal(session.getSessionUserId(), 'user-test');
    assert.equal(session.hasAuthSession(), true);

    session.clearAuthSession();
    assert.equal(session.getAccessToken(), null);
    assert.equal(session.getSessionUserId(), null);
    assert.equal(session.hasAuthSession(), false);
    assert.deepEqual(events, ['nexi:wallet-session', 'nexi:wallet-session']);
  } finally {
    globalThis.window = previousWindow;
  }
});

test('public session establishment keeps only the access token in memory and publishes the existing session event', async () => {
  const session = await source('app/lib/auth-session.ts');
  const walletAuth = await source('app/lib/wallet-auth.ts');
  const login = await source('app/login/page.tsx');
  const signup = await source('app/signup/page.tsx');

  assert.match(session, /setAuthSession/);
  assert.match(session, /payload\.access_token/);
  assert.doesNotMatch(session, /refresh_token|getRefreshToken/);
  assert.match(session, /nexi:wallet-session/);
  assert.match(walletAuth, /setAuthSession/);
  assert.match(login, /WalletConnectControl/);
  assert.match(signup, /WalletConnectControl/);
  assert.doesNotMatch(login, /\/auth\/login|email|password/i);
  assert.doesNotMatch(signup, /\/auth\/signup|email|password/i);
});

test('public refresh uses the HttpOnly cookie contract and never accepts a browser refresh token', async () => {
  const controller = await readFile(new URL('../../backend/src/auth/auth.controller.ts', frontendRoot), 'utf8');
  assert.match(controller, /@Post\("refresh"\)/);
  assert.doesNotMatch(controller, /body\.refreshToken/);
  assert.match(controller, /cookie/);
  assert.match(controller, /httpOnly:\s*true/);
  assert.match(controller, /secure:\s*true/);
});


test('public dashboard shell is not globally blocked on wallet-environment detection', async () => {
  const layout = await source('app/dashboard/layout.tsx');
  assert.doesNotMatch(layout, /WalletAccessGate/);
});

test('wallet environment QA bypass is explicit and impossible in production builds', async () => {
  const gate = await source('app/components/WalletAccessGate.tsx');
  assert.match(gate, /NODE_ENV\s*!==\s*['"]production['"]/);
  assert.match(gate, /NEXT_PUBLIC_NEXI_UI_QA_BYPASS_WALLET_ENVIRONMENT/);
  assert.match(gate, /===\s*['"]1['"]/);
  assert.match(gate, /uiQaBypassWalletEnvironment[\s\S]*return <>{children}<\/>/);
});
