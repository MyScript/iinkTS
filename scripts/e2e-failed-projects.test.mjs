import { describe, test } from "node:test"
import assert from "node:assert/strict"

import { failedProjects } from "./e2e-failed-projects.mjs"

const spec = (...tests) => ({ tests: tests.map(([projectName, status]) => ({ projectName, status })) })

describe("failedProjects", () => {
  test("lists each project with an unexpected result once", () => {
    const report = {
      suites: [
        { specs: [spec(["Desktop Chrome", "unexpected"], ["Tablet Safari", "expected"])] },
        { specs: [spec(["Desktop Chrome", "unexpected"], ["Tablet Safari", "unexpected"])] },
      ],
    }
    assert.deepEqual(failedProjects(report).sort(), ["Desktop Chrome", "Tablet Safari"])
  })
  test("ignores flaky and skipped tests", () => {
    const report = { suites: [{ specs: [spec(["Desktop Chrome", "flaky"], ["Tablet Safari", "skipped"])] }] }
    assert.deepEqual(failedProjects(report), [])
  })
  test("reads nested suites", () => {
    const report = { suites: [{ suites: [{ suites: [{ specs: [spec(["Whiteboard Chrome", "unexpected"])] }] }] }] }
    assert.deepEqual(failedProjects(report), ["Whiteboard Chrome"])
  })
})
