// Prints how many Playwright projects failed in a JSON report: CI fails the build past one, and
// marks it unstable for one, as when each project ran in its own stage.
// Usage: node scripts/e2e-failed-projects.mjs <report.json>
import { readFileSync } from "node:fs"
import process from "node:process"

/** The projects with at least one test that failed every attempt */
export function failedProjects(report) {
  const failed = new Set()
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        if (test.status === "unexpected") failed.add(test.projectName)
      }
    }
    suite.suites?.forEach(visit)
  }
  report.suites.forEach(visit)
  return [...failed]
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const failed = failedProjects(JSON.parse(readFileSync(process.argv[2], "utf8")))
  process.stderr.write(`Failed projects: ${failed.join(", ") || "none"}\n`)
  process.stdout.write(`${failed.length}\n`)
}
