import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const targets = JSON.parse(read('platform/cloudflare-targets.json'));
const worker = read('cloudflare-container-bootstrap/wrangler.jsonc');
const publicEnv = read('cloudflare-container-bootstrap/dexi-frontend/.env.example');
const adminEnv = read('apps/admin/.env.example');

const checks = [
  ['API custom domain', worker.includes('"pattern": "api.nexitrading.app"')],
  ['CORS public app', worker.includes('https://app.nexitrading.app')],
  ['CORS admin app', worker.includes('https://admin.nexitrading.app')],
  ['Wallet auth domain', worker.includes('"WALLET_AUTH_DOMAIN": "app.nexitrading.app"')],
  ['Canonical health URL', worker.includes('"NEXI_HEALTH_URL": "https://api.nexitrading.app/readyz"')],
  ['Public API URL', publicEnv.includes(`NEXT_PUBLIC_API_URL=${targets.api}`)],
  ['Public platform URL', publicEnv.includes(`NEXT_PUBLIC_PLATFORM_URL=${targets.public_app}`)],
  ['Admin live provider', adminEnv.includes('VITE_ADMIN_PROVIDER_MODE=live')],
  ['Admin API URL', adminEnv.includes(`VITE_ADMIN_API_BASE_URL=${targets.api}`)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('PASS NEXI platform endpoint sync');
