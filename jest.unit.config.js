export default {
  clearMocks: true,
  // collectCoverage: true,
  collectCoverageFrom: [
    "./src/**/**.ts",
    "!./src/modules.d.ts",
    "!./src/Constants.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  coverageDirectory: "coverage",
  coverageProvider: "v8", // "babel"
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  moduleNameMapper: {
    "web-worker:(.*)\\.worker.ts": "<rootDir>/src/worker/$1.worker.ts",
  },
  modulePathIgnorePatterns: [
    "./test/unit/__dataset__",
    "./test/unit/__mocks__"
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
    "**/unit/**/**.test.ts"
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
