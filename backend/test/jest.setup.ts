import { jest } from "@jest/globals";
(globalThis as any).jest = jest;
// Unit tests that do not exercise the D1 Prisma client must not load the
// production adapter transitively. Prisma's D1 adapter imports ESM-only ky;
// the NestJS 12 test harness runs through Jest's ESM VM-module path.
jest.unstable_mockModule('../src/d1/d1-prisma.service', () => ({
  D1PrismaService: class D1PrismaService {
    isEnabled() {
      return false;
    }

    isReady() {
      return Promise.resolve(false);
    }
  },
}));
