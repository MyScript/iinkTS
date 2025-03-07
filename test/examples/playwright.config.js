import { defineConfig, devices } from "@playwright/test";

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
    name: "Desktop Firefox",
    use: {...devices["Desktop Firefox"]}
  },
  {
    name: "Desktop Safari",
    use: {...devices["Desktop Safari"]}
  },
  {
    name: "Tablet Chrome",
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
]

let projects
if (process.env.PROJECT) {
  const proj = defaultProject.find(p => process.env.PROJECT === p.name)
  if (!proj) {
    console.error(`PROJECT not found: ${process.env.PROJECT}, values allowed are: [${defaultProject.map(p => p.name).join(", ")}]` )
  }
  else {
    projects = [proj]
  }
}
else {
  projects = defaultProject
}
process.env.PLAYWRIGHT_LIST_PRINT_STEPS = true

export default defineConfig({
  testMatch: "**/examples/**/*.test.js",
  outputDir: "test-results",
  retries: 1,
  timeout: 3 * 60 * 1000,
  workers: process.env.CI ? 1 : undefined,
  use: {
    headless: process.env.HEADLESS === "false" ? false : true,
    baseURL: process.env.BASE_URL || "http://localhost:8000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "on-first-retry",
  },
  projects,
  snapshotDir: "./__snapshots__",
  snapshotPathTemplate: "./__snapshots__/{testFilePath}/{projectName}/{arg}{ext}",
  reporter: 'list',
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1,
    },
  }
});
