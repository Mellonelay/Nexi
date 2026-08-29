import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = new URL('../prisma/schema.prisma', import.meta.url);
const targetPath = new URL('../prisma/schema.d1.prisma', import.meta.url);
const source = await readFile(sourcePath, 'utf8');

const output = source
  .replace('provider = "postgresql"', 'provider = "sqlite"')
  .replace(
    'generator client {\n  provider = "prisma-client-js"\n}',
    'generator client {\n  provider = "prisma-client-js"\n  output = "../src/prisma/d1-client"\n}',
  )
  .split('\n')
  .map((line) => {
    if (/^\s+\w+\s+Decimal\??(?:\s|$)/.test(line)) {
      return line
        .replace(/\bDecimal\b/, 'String')
        .replace(/@default\((-?(?:\d+\.?\d*|\.\d+))\)/, '@default("$1")')
        .replace(/\s+@db\.Decimal\(38,\s*18\)/, '');
    }
    if (/^\s+\w+\s+Json\??(?:\s|$)/.test(line)) {
      return line.replace(/\bJson\b/, 'String');
    }
    if (/^\s+\w+\s+BigInt\??(?:\s|$)/.test(line)) {
      return line.replace(/\bBigInt\b/, 'String');
    }
    if (/^\s+\w+\s+Float\??(?:\s|$)/.test(line)) {
      return line
        .replace(/\bFloat\b/, 'String')
        .replace(/@default\((-?(?:\d+\.?\d*|\.\d+))\)/, '@default("$1")');
    }
    return line.replace(/\s+@db\.[A-Za-z0-9_]+(?:\([^)]*\))?/g, '');
  })
  .join('\n');

await writeFile(targetPath, output);
console.log(`generated ${targetPath.pathname}`);
