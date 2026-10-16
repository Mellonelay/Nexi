const base = require('./jest-local-sqlite.config.cjs');
module.exports = { ...base, testRegex: '/test/jobs/.*\\.integration\\.ts$' };
