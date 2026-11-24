import process from 'node:process'
import { defineConfig, devices } from "@playwright/test"

/*
 * Tags, on a root `describe` (a variant is targeted by its folder, not by a tag):
 * - @minimal: the vital path of a variant, played by every project
 * - @touch: an interaction a touch screen can change (gestures, drag, selection, tools, menus)
 * - @slow: a test over 30s in CI; `--grep-invert @slow` for a quick local loop
 * Untagged by level means "complete": a project without `grep` plays everything.
 * E2E_SCOPE overrides every project's filter: "complete" (everything) or "minimal" (@minimal only);
 * unset or "default" keeps each project's own.
 */
const MINIMAL = /@minimal/
const MINIMAL_AND_TOUCH = /@minimal|@touch/

const defaultProject = [
  {
    name: "Desktop Chrome",
    use: {
      ...devices["Desktop Chrome"],
      contextOptions: {
        permissions: ["clipboard-read", "clipboard-write"],
      },
    }
  },
  {
    // Engine signal only: the PR pipeline does not run it
    name: "Desktop Firefox",
    grep: MINIMAL,
    use: {...devices["Desktop Firefox"]}
  },
  {
    // Same engine as Tablet Safari, which plays everything
    name: "Desktop Safari",
    grep: MINIMAL,
    use: {...devices["Desktop Safari"]}
  },
  {
    name: "Tablet Chrome",
    // Same engine as Whiteboard Chrome: not in the PR pipeline
    grep: MINIMAL_AND_TOUCH,
    use: {
      ...devices["Galaxy Tab S4 landscape"],
      contextOptions: {
        permissions: ["clipboard-read", "clipboard-write"],
      },
    }
  },
  {
    name: "Tablet Safari",
    use: {...devices["iPad Mini landscape"]}
  },
  {
    // An interactive whiteboard: a large touch screen running a Chromium browser
    name: "Whiteboard Chrome",
    grep: MINIMAL_AND_TOUCH,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1920, height: 1080 },
      hasTouch: true,
      contextOptions: {
        permissions: ["clipboard-read", "clipboard-write"],
      },
    }
  },
]

const scope = process.env.E2E_SCOPE || "default"
const SCOPES = { complete: undefined, minimal: MINIMAL }
if (scope !== "default" && !(scope in SCOPES)) {
  console.error(`E2E_SCOPE not found: ${scope}, values allowed are: [default, ${Object.keys(SCOPES).join(", ")}]`)
}

/** The project with the filter E2E_SCOPE asks for, or its own */
function scoped(project) {
  if (!(scope in SCOPES)) {
    return project
  }
  const { grep, ...rest } = project
  return SCOPES[scope] ? { ...rest, grep: SCOPES[scope] } : rest
}

/** PROJECT: one project name, or several separated by commas */
let projects = defaultProject.map(scoped)
if (process.env.PROJECT) {
  const names = process.env.PROJECT.split(",").map(name => name.trim())
  const unknown = names.filter(name => !defaultProject.some(p => p.name === name))
  if (unknown.length) {
    console.error(`PROJECT not found: ${unknown.join(", ")}, values allowed are: [${defaultProject.map(p => p.name).join(", ")}]` )
  }
  projects = defaultProject.filter(p => names.includes(p.name)).map(scoped)
}
process.env.PLAYWRIGHT_LIST_PRINT_STEPS = true

export default defineConfig({
  globalSetup: "./global-setup.js",
  testMatch: "**/examples/**/*.test.js",
  outputDir: "test-results",
  retries: 1,
  timeout: 60 * 1000,
  // CI: one worker per project, as many as when each project ran in its own stage
  workers: process.env.CI ? Math.max(projects.length, 1) : 4,
  use: {
    headless: process.env.HEADLESS === "false" ? false : true,
    baseURL: process.env.BASE_URL || "http://localhost:8000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects,
  snapshotDir: "./__snapshots__",
  snapshotPathTemplate: "./__snapshots__/{testFilePath}/{projectName}/{arg}{ext}",
  // CI counts the failed projects in the JSON report (scripts/e2e-failed-projects.mjs)
  reporter: process.env.CI ? [["list"], ["json", { outputFile: "test-results/report.json" }]] : "list",
  expect: {
    timeout: 2500,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1,
    },
  }
});
