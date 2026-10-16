import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('production runtime dependencies', () => {
  it('installs the generated Prisma client and its runtime helpers without dev dependencies', () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    );

    expect(packageJson.dependencies['@prisma/client']).toBeDefined();
  });
});
