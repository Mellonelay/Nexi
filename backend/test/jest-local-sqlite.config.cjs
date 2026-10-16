const { jest: config } = require('../package.json');
module.exports = {
  ...config,
  rootDir: '..',
  // The shared test setup intentionally mocks D1PrismaService. This isolated
  // integration suite must exercise the real Prisma client instead.
  setupFiles: [],
};
