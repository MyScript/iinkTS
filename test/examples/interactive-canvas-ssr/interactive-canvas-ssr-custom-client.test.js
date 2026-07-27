import { test, expect } from "@playwright/test"
import { writeStrokes, waitForCanvasInit, waitForExportedEvent, getCanvasConfiguration, passModalKey } from "../helper"
import h from "../__dataset__/h"

test.describe("Interactive Canvas SSR with custom client", () => {
  let lastMessageReceived
  let lastMessageSent

  test.beforeEach(async ({ page }) => {
    page.on('websocket', ws => {
      ws.on('framesent', event => lastMessageSent = event.payload)
      ws.on('framereceived', event => lastMessageReceived = event.payload)
    })
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas-ssr/interactive_canvas_ssr_custom_client.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Interactive Canvas SSR custom client")
  })

  test("should display last message sent and received", async ({ page }) => {

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])

    const conf = await getCanvasConfiguration(page)
    await expect(page.locator("#client-url")).toHaveText(`connection established at ${conf.server.scheme === "http" ? "ws" : "wss"}://${conf.server.host}/api/v4.0/iink/document?applicationKey=${conf.server.applicationKey}`)
    await expect(page.locator("#client-sent")).toHaveText(`Message sent: ${lastMessageSent}`)
    await expect(page.locator("#client-received")).toHaveText(`Message received: ${lastMessageReceived}`)
  })
})
