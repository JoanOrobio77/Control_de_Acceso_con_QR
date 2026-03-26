module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/models/index.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

