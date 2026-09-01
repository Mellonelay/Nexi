// Unit tests that do not exercise the D1 Prisma client must not load the
// production adapter transitively. Prisma's D1 adapter imports ESM-only ky,
// while this Jest suite runs in CommonJS mode.
jest.mock('../src/d1/d1-prisma.service', () => ({
  D1PrismaService: class D1PrismaService {
    isEnabled() {
      return false;
    }

    isReady() {
      return Promise.resolve(false);
    }
  },
}));
