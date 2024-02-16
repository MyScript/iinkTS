export default {
  clearMocks: true,
  // collectCoverage: true,
  collectCoverageFrom: [
    "./src/**/*.ts",
    "!./src/modules.d.ts",
    "!./src/Constants.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      // statements: -10,
    },
  },
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  preset: "ts-jest",
  setupFiles: [
    "jest-canvas-mock",
    "./test/unit/jest.setup.js",
    "./test/unit/text-encoder.mock.ts"
  ],
  setupFilesAfterEnv: [
    "jest-websocket-mock",
    "./test/unit/setupTests.ts"
  ],
  testEnvironment: "jsdom",
  testMatch: [
    "**/unit/**/*.test.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  transform: {
    "^.+\\.css$": "jest-transform-css",
    "^.+\\.svg$": "<rootDir>/test/unit/svgTransform.js",
  },
  verbose: false
}
