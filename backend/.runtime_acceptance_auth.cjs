const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');

const base = process.env.NEXI_STAGING_URL || 'https://nexi-staging.melloenfrwrk.workers.dev';
const account = privateKeyToAccount(generatePrivateKey());

async function request(path, init = {}) {
  const response = await fetch(base + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch {}
  return { response, body };
}

(async () => {
  const challenge = await request('/auth/wallet/challenge', {
    method: 'POST',
    body: JSON.stringify({ address: account.address, chainId: 1 }),
  });
  if (challenge.response.status !== 201 || !challenge.body?.message) throw new Error(`challenge=${challenge.response.status}`);

  const signature = await account.signMessage({ message: challenge.body.message });
  const verify = await request('/auth/wallet/verify', {
    method: 'POST',
    body: JSON.stringify({ message: challenge.body.message, signature }),
  });
  const accessToken = verify.body?.access_token;
  if (verify.response.status !== 201 || typeof accessToken !== 'string') throw new Error(`verify=${verify.response.status}`);

  const authHeaders = { authorization: `Bearer ${accessToken}` };
  const me = await request('/auth/me', { headers: authHeaders });
  const unauthenticated = await request('/auth/me');
  const logout = await request('/auth/logout', { method: 'POST', headers: authHeaders });
  const revoked = await request('/auth/me', { headers: authHeaders });
  if (me.response.status !== 200 || unauthenticated.response.status !== 401 || logout.response.status < 200 || logout.response.status >= 300 || revoked.response.status !== 401) {
    throw new Error(`auth_regression me=${me.response.status} unauth=${unauthenticated.response.status} logout=${logout.response.status} revoked=${revoked.response.status}`);
  }
  console.log(JSON.stringify({
    challenge: challenge.response.status,
    verify: verify.response.status,
    authMe: me.response.status,
    unauthenticated: unauthenticated.response.status,
    logout: logout.response.status,
    revoked: revoked.response.status,
    walletAddressMatches: me.body?.walletAddress?.toLowerCase() === account.address.toLowerCase(),
    identityReturned: Boolean(me.body?.id),
  }));
})().catch((error) => {
  console.error('AUTH_REGRESSION_FAIL=' + error.message);
  process.exitCode = 1;
});
