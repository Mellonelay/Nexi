import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Prisma CLI uses the direct, non-pooled endpoint for migrations and
    // introspection. Application runtime pooling remains in PrismaService via
    // DATABASE_URL.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
