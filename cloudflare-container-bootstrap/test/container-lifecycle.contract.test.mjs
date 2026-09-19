import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');

test('Container class owns startup defaults and Worker recovers the observed inactive-container fetch race', () => {
  assert.match(source, /constructor\(ctx, env\)\s*\{[\s\S]*super\(ctx, env\)[\s\S]*this\.envVars\s*=\s*containerEnv\(env\)/);
  assert.match(source, /requiredPorts\s*=\s*\[3000\]/);
  assert.match(source, /sleepAfter\s*=\s*["']168h["']/);
  assert.match(source, /async\s+onActivityExpired\s*\(\)\s*\{[\s\S]*?policy:\s*["']continuous-runtime["']/);
  assert.doesNotMatch(source, /async fetch\(request, env, ctx\)[\s\S]*?await getRunningNexiContainer\(env\)/);
  assert.match(source, /async function fetchNexiContainer\(container, request\)[\s\S]*?container\.fetch\(request\)[\s\S]*?container\.startAndWaitForPorts\([\s\S]*?container\.fetch\(request\)/);
  assert.match(source, /The container is not running, consider calling start\(\)/);
  assert.match(source, /return\s+await\s+fetchNexiContainer\(container, request\)/);
});
