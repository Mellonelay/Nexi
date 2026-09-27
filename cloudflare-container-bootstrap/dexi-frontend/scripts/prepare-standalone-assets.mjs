import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function findNestedServer(standaloneRoot) {
  const matches = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
        visit(join(directory, entry.name));
      } else if (entry.name === 'server.js' && (entry.isFile() || entry.isSymbolicLink())) {
        const candidate = join(directory, entry.name);
        try {
          const source = readFileSync(candidate, 'utf8').slice(0, 16_384);
          if (source.includes('currentPort') && source.includes('nextConfig')) {
            matches.push(realpathSync(candidate));
          }
        } catch {
          // Ignore unreadable or broken candidate links; the final error is explicit.
        }
      }
    }
  };
  visit(standaloneRoot);
  if (matches.length !== 1) {
    throw new Error(`Expected one Next standalone server under ${standaloneRoot}; found ${matches.length}`);
  }
  return matches[0];
}

function copyTree(source, destination, label) {
  if (!existsSync(source)) {
    throw new Error(`Required standalone ${label} source is missing: ${source}`);
  }

  const realSource = realpathSync(source);
  if (realSource === destination) return;

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(realSource, destination, { recursive: true, preserveTimestamps: true });
}

export function prepareStandaloneAssets(projectRoot = process.cwd()) {
  const standaloneRoot = join(projectRoot, '.next', 'standalone');
  const serverEntry = join(standaloneRoot, 'server.js');
  const actualServer = existsSync(serverEntry) ? realpathSync(serverEntry) : findNestedServer(standaloneRoot);
  if (!existsSync(serverEntry)) {
    symlinkSync(relative(standaloneRoot, actualServer), serverEntry);
  }
  const serverRoot = dirname(realpathSync(serverEntry));
  copyTree(join(projectRoot, '.next', 'static'), join(serverRoot, '.next', 'static'), 'static');
  copyTree(join(projectRoot, 'public'), join(serverRoot, 'public'), 'public');
  return { serverRoot };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { serverRoot } = prepareStandaloneAssets();
  console.log(`Prepared standalone assets beside server: ${serverRoot}`);
}
