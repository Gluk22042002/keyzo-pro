export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['./server/__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 15000,
};
