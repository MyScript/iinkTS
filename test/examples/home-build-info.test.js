import { test, expect } from "@playwright/test"

const HOME = `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/index.html`
const SERVER = { scheme: "https", host: "backend.example" }

/** Sets the server the examples use, or none, before any page script runs */
async function useServer(page, server) {
  // Keeps the local .env.local from setting a server behind the test's back
  await page.route("**/dev-env-loader.generated.js", (route) => route.abort())
  await page.addInitScript((value) => {
    window.localStorage.removeItem("server")
    if (value) window.localStorage.setItem("server", JSON.stringify(value))
  }, server)
}

async function serveBuildInfo(page, body) {
  await page.route("**/examples/build-info.json", (route) =>
    body ? route.fulfill({ json: body }) : route.fulfill({ status: 404 })
  )
}

async function serveBackendVersion(page, body) {
  await page.route(`https://${SERVER.host}/api/v4.0/iink/version`, (route) =>
    body ? route.fulfill({ json: body }) : route.abort()
  )
}

test.describe("Home build info", () => {
  test("should show the iink-ts and iink-backend references", async ({ page }) => {
    await useServer(page, SERVER)
    await serveBuildInfo(page, { commit: "0123456789abcdef", version: "5.0.0-beta.12" })
    await serveBackendVersion(page, { version: "4.6.0", gitCommit: "fedcba9876543210", nativeVersion: "4.6.0" })
    await page.goto(HOME)

    const footer = page.locator("#build-info")
    await expect(footer).toBeVisible()
    await expect(footer.locator("span")).toHaveText([
      "iink-ts · 5.0.0-beta.12 · 0123456",
      "iink-backend · 4.6.0 · fedcba9",
    ])
  })

  test("should show nothing from the server when it does not answer", async ({ page }) => {
    await useServer(page, SERVER)
    await serveBuildInfo(page, { commit: "0123456789abcdef", version: "5.0.0" })
    await serveBackendVersion(page, undefined)
    await page.goto(HOME)

    await expect(page.locator("#build-info span")).toHaveText(["iink-ts · 5.0.0 · 0123456"])
  })

  test("should hide the footer without build info nor server", async ({ page }) => {
    await useServer(page, undefined)
    await serveBuildInfo(page, undefined)
    await page.goto(HOME)

    const footer = page.locator("#build-info[data-loaded]")
    await expect(footer).toBeAttached()
    await expect(footer).toBeHidden()
  })
})
