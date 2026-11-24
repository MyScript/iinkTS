/**
 * The perf harness's own unit tests.
 *
 * Separate from `test/unit/jest.config.js` because a config should govern the folder it lives in:
 * that one was briefly widened to reach into `perf/`, which put the harness's tests under a config
 * carrying jsdom, canvas and websocket mocks none of them need.
 *
 * These test the decision rules — the gate, the pairing arithmetic, the history record — which are
 * plain functions over plain data. No DOM, no mocks, no setup.
 */
export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": ["@swc/jest", { jsc: { parser: { syntax: "typescript" }, target: "esnext" } }],
  },
  testMatch: ["<rootDir>/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  // `src` is the unit suite's business. Nothing here is measured for coverage: these tests exist to
  // keep the harness honest, and a percentage over six files would say nothing.
  collectCoverageFrom: [],
}
