import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');

test('Container class owns startup defaults and Worker uses a single fetch lifecycle', () => {
  assert.match(source, /constructor\(ctx, env\)\s*\{[\s\S]*super\(ctx, env\)[\s\S]*this\.envVars\s*=\s*containerEnv\(env\)/);
  assert.match(source, /requiredPorts\s*=\s*\[3000\]/);
  assert.match(source, /sleepAfter\s*=\s*["']168h["']/);
  assert.match(source, /async\s+onActivityExpired\s*\(\)\s*\{[\s\S]*?policy:\s*["']continuous-runtime["']/);
  assert.match(source, /container\.startAndWaitForPorts\s*\(/);
  assert.match(source, /container\.start\(\{\s*envVars:\s*containerEnv\(env\)/);
  assert.match(source, /return\s+(?:await\s+)?container\.fetch\(request\)/);
});
