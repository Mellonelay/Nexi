import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const consumers = [
  'app/dashboard/messages/page.tsx',
  'app/dashboard/binary/page.tsx',
  'app/components/NotificationsPanel.tsx',
];

for (const path of consumers) {
  test(`${path} reads the current session at each socket handshake`, () => {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    const callback = source.match(/auth:\s*(\(callback\)\s*=>\s*callback\(\{\s*token:\s*getAccessToken\(\)\s*\}\))/)?.[1];
    assert.ok(callback, 'Authenticated sockets must match the Support dynamic auth contract');
    let token = 'initial-token';
    const auth = vm.runInNewContext(`(${callback})`, { getAccessToken: () => token });
    const received = [];
    const handshake = (payload) => received.push(payload.token);
    auth(handshake);
    token = 'renewed-token';
    auth(handshake);
    token = null;
    auth(handshake);
    assert.deepEqual(received, ['initial-token', 'renewed-token', null]);
  });
}

test('Notifications ignores previous-principal responses and reconnects its private socket on account change', () => {
  const source = readFileSync(new URL('../app/components/NotificationsPanel.tsx', import.meta.url), 'utf8');
  assert.match(source, /requestPrincipalId !== getAccessTokenPrincipalId\(\)/);
  assert.match(source, /setPrincipalId\(next\)/);
  assert.match(source, /if \(getAccessTokenPrincipalId\(\) !== principalId\) return;/);
  assert.match(source, /\[loadNotifications, open, principalId\]/);
});
