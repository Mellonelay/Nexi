import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { prepareStandaloneAssets } from './prepare-standalone-assets.mjs';

function createBuild(root, serverRelativePath) {
  const server = join(root, '.next', 'standalone', serverRelativePath);
  mkdirSync(join(root, '.next', 'static', 'chunks'), { recursive: true });
  mkdirSync(join(root, 'public'), { recursive: true });
  mkdirSync(server, { recursive: true });
  writeFileSync(join(root, '.next', 'static', 'chunks', 'app.js'), 'bundle');
  writeFileSync(join(root, 'public', 'manifest.json'), '{"name":"NEXI"}');
  writeFileSync(join(server, 'server.js'), 'const currentPort = 3000; const nextConfig = {};');
  return server;
}

function assertAssetsCopied(root, serverRoot) {
  assert.equal(readFileSync(join(serverRoot, '.next', 'static', 'chunks', 'app.js'), 'utf8'), 'bundle');
  assert.equal(readFileSync(join(serverRoot, 'public', 'manifest.json'), 'utf8'), '{"name":"NEXI"}');
  writeFileSync(join(serverRoot, '.next', 'static', 'stale.js'), 'stale');
  prepareStandaloneAssets(root);
  assert.equal(readFileSync(join(serverRoot, '.next', 'static', 'chunks', 'app.js'), 'utf8'), 'bundle');
  assert.throws(() => readFileSync(join(serverRoot, '.next', 'static', 'stale.js')));
}

test('copies static and public assets beside a workspace-nested standalone server', () => {
  const root = mkdtempSync(join(tmpdir(), 'nexi-standalone-nested-'));
  try {
    const serverRoot = createBuild(root, 'workspace-app');
    assert.deepEqual(prepareStandaloneAssets(root), { serverRoot });
    assert.equal(realpathSync(join(root, '.next', 'standalone', 'server.js')), join(serverRoot, 'server.js'));
    assertAssetsCopied(root, serverRoot);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('copies static and public assets beside a root standalone server', () => {
  const root = mkdtempSync(join(tmpdir(), 'nexi-standalone-root-'));
  try {
    const serverRoot = createBuild(root, '.');
    assert.deepEqual(prepareStandaloneAssets(root), { serverRoot });
    assertAssetsCopied(root, serverRoot);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
