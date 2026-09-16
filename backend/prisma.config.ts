import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.d1.prisma',
  datasource: {
    // Generate the D1 client without requiring any external database URL.
    url: 'file:./d1-tooling.db',
  },
});
