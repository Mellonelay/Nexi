import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.d1.prisma',
  datasource: {
    // Generate the SQLite Prisma client without opening live financial state.
    url: 'file:./sqlite-prisma-tooling.db',
  },
});
