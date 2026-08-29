import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');

test('Container class owns startup defaults and Worker uses a single fetch lifecycle', () => {
  assert.match(source, /import\s*\{\s*env\s+as\s+workerEnv\s*\}\s*from\s*["']cloudflare:workers["']/);
  assert.match(source, /requiredPorts\s*=\s*\[3000\]/);
  assert.match(source, /envVars\s*=\s*containerEnv\(workerEnv\)/);
  assert.match(source, /async\s+onActivityExpired\s*\(\)\s*\{[\s\S]*?await\s+this\.destroy\(\)/);
  assert.doesNotMatch(source, /container\.startAndWaitForPorts\s*\(/);
  assert.doesNotMatch(source, /container\.start\s*\(/);
  assert.match(source, /return\s+container\.fetch\(request\)/);
});
