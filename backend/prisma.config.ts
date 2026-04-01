import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: 'postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public',
  },
});
