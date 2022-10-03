
export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**',
    '!./src/@types/**'
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleFileExtensions: [
    'ts',
    'js'
  ],
  preset: 'ts-jest',
  setupFiles: [
    "jest-canvas-mock"
  ],
  testEnvironment: 'jsdom',
  testMatch: [
    '**/unit/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  transform: {
    "^.+\\.css$": "jest-transform-css"
  },
  verbose: false
}