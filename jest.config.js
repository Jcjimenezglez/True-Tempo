module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
  collectCoverageFrom: [
    'api/**/*.js',
    'script.js',
    '!api/test-*.js',
    '!api/debug/**',
    '!scripts/**',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0
    }
  },
  verbose: true
};
