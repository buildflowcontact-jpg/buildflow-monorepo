module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/src/setupJestEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // Autoriser la transformation de react-pdf-highlighter (ESM)
  transformIgnorePatterns: [
    '/node_modules/(?!(react-pdf-highlighter|ts-debounce)/)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/tests/',
    '\\.(spec|e2e)\\.ts$'
  ]
};
