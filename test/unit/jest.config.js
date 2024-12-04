export default {
  rootDir: "../../",
  clearMocks: true,
  // collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/src/**/**.ts",
    "!<rootDir>/src/modules.d.ts",
    "!<rootDir>/src/Constants.ts",
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
    "<rootDir>/test/unit/__dataset__",
    "<rootDir>/test/unit/__mocks__"
  ],
  preset: "ts-jest",
  setupFiles: [
    "jest-canvas-mock",
    "<rootDir>/test/unit/__config__/jest.setup.ts",
    "<rootDir>/test/unit/__config__/text-encoder.mock.ts",
    "<rootDir>/test/unit/__config__/setupTests.ts"
  ],
  setupFilesAfterEnv: [
    "jest-websocket-mock",
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
    "^.+\\.svg$": "<rootDir>/test/unit/__config__/svgTransform.ts",
  },
  verbose: false
}
