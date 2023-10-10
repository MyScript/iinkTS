import { devices } from "playwright"

const projects = [
  {
    name: "Desktop Chrome",
    ...devices["Desktop Chrome"]
  },
  {
    name: "Desktop Firefox",
    ...devices["Desktop Firefox"]
  },
  {
    name: "Desktop Safari",
    ...devices["Desktop Safari"]
  },
  {
    name: "Tablet Chrome",
    ...devices["Galaxy Tab S4 landscape"]
  },
  {
    name: "Tablet Safari",
    ...devices["iPad Mini landscape"],
  },
]

const testEnvironmentOptions = {
  "jest-playwright": {
    contextOptions: {
      baseURL: process.env.BASE_URL || "http://localhost:8000",
      ignoreHTTPSErrors: true,
    },
    exitOnPageError: true,
    useDefaultBrowserType: true,
    launchOptions: {
      headless: process.env.HEADLESS === "false" ? false : true,
    },
  },
}
if (process.env.DEVICE) {
  testEnvironmentOptions["jest-playwright"].devices = [process.env.DEVICE]
}
if (process.env.BROWSER) {
  testEnvironmentOptions["jest-playwright"].browsers = [process.env.BROWSER]
}
if (process.env.PROJECT) {
  const proj = projects.find(p => process.env.PROJECT === p.name)
  testEnvironmentOptions["jest-playwright"].devices = [proj]
  testEnvironmentOptions["jest-playwright"].browsers = [proj.defaultBrowserType]
}
if(!process.env.DEVICE && !process.env.BROWSER && !process.env.PROJECT) {
  testEnvironmentOptions["jest-playwright"].devices = projects
  testEnvironmentOptions["jest-playwright"].browsers = ["chromium", "firefox", "webkit"]
}

export default {
  preset: "jest-playwright-preset",

  testEnvironmentOptions,

  setupFilesAfterEnv: ["expect-playwright", "./test/integration/jest.setup.js"],

  testMatch: ["**/integration/**/*.test.js"],

  verbose: false,
}
