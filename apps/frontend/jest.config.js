module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // Autoriser la transformation de react-pdf-highlighter (ESM)
  transformIgnorePatterns: [
    '/node_modules/(?!(react-pdf-highlighter)/)'
  ],
};