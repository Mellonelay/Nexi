import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname } from 'node:path';

const frontendDirectory = dirname(fileURLToPath(import.meta.url));
const wagmiUrl = pathToFileURL(`${frontendDirectory}/wagmi.ts`).href;
let chainIds;

function loadWalletChainIds() {
  if (chainIds) return chainIds;

  const script = `
    const production = await import(${JSON.stringify(`${wagmiUrl}?test=production`)});
    process.env.NODE_ENV = 'development';
    const development = await import(${JSON.stringify(`${wagmiUrl}?test=development`)});
    console.log('NEXI_CHAIN_IDS=' + JSON.stringify({
      production: production.walletChain.id,
      productionSupported: production.config.chains.map(({ id }) => id),
      development: development.walletChain.id,
      developmentSupported: development.config.chains.map(({ id }) => id),
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    {
      cwd: frontendDirectory,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'production' },
      timeout: 60_000,
    },
  );

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  const match = result.stdout.match(/^NEXI_CHAIN_IDS=(.+)$/m);
  assert.ok(match, `Wallet chain IDs missing from output: ${result.stdout}`);
  chainIds = JSON.parse(match[1]);
  return chainIds;
}

test('production wallet configuration selects only Ethereum Mainnet', () => {
  const chains = loadWalletChainIds();
  assert.equal(chains.production, 1);
  assert.deepEqual(chains.productionSupported, [1]);
});

test('non-production wallet configuration retains only Sepolia', () => {
  const chains = loadWalletChainIds();
  assert.equal(chains.development, 11155111);
  assert.deepEqual(chains.developmentSupported, [11155111]);
});
