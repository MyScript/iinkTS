
export default {
  clearMocks: true,
  // collectCoverage: true,
  collectCoverageFrom: [
    "./src/**",
    "!./src/@types/**",
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
    "./test/unit/jest.setup.js"
  ],
  setupFilesAfterEnv: [
    "jest-websocket-mock"
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
