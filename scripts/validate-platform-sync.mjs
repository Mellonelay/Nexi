import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const targets = JSON.parse(read('platform/cloudflare-targets.json'));
const worker = read('cloudflare-container-bootstrap/wrangler.jsonc');
const publicEnv = read('cloudflare-container-bootstrap/dexi-frontend/.env.example');
const adminData = read('apps/admin/src/admin/data/context.tsx');

const publicHost = new URL(targets.public_app).hostname;
const checks = [
  ['Public canonical host', targets.public_app === 'https://www.nexitrading.app'],
  ['API custom domain', worker.includes('"pattern": "api.nexitrading.app"')],
  ['CORS canonical Public and Admin origins', worker.includes(`"CORS_ORIGINS": "${targets.public_app},${targets.admin_app}"`)],
  ['SIWE canonical domain', worker.includes(`"WALLET_AUTH_DOMAIN": "${publicHost}"`)],
  ['SIWE canonical URI', worker.includes(`"WALLET_AUTH_URI": "${targets.public_app}"`)],
  ['Worker identity', worker.includes('"name": "' + targets.worker + '"')],
  ...targets.required_worker_secrets.map((name) => ['Required Worker secret ' + name, worker.includes('"' + name + '"')]),
  ['Retired market archive secret absent', !worker.includes('MARKET_ARCHIVE_PIPELINE_TOKEN')],
  ['Public API URL', publicEnv.includes(`NEXT_PUBLIC_API_URL=${targets.api}`)],
  ['Public platform URL', publicEnv.includes(`NEXT_PUBLIC_PLATFORM_URL=${targets.public_app}`)],
  ['Admin API URL', adminData.includes(`"https://api.nexitrading.app"`)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log('PASS NEXI canonical host and platform endpoint sync');
