import { test, expect } from "@playwright/test"
import { writeStrokes, waitForEditorWebSocket, callEditorIdle, waitForExportedEvent, getEditorConfiguration } from "../helper"
import h from "../__dataset__/h"

test.describe("Websocket custom recognizer", () => {
  let lastMessageReceived
  let lastMessageSent
  test.beforeEach(async ({ page }) => {
    page.on('websocket', ws => {
      ws.on('framesent', event => lastMessageSent = event.payload)
      ws.on('framereceived', event => lastMessageReceived = event.payload)
    })
    await page.goto("/examples/dev/websocket_custom_recognizer.html")
    await waitForEditorWebSocket(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket custom recognizer")
  })

  test("should display last message sent and received", async ({ page }) => {

    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])

    const conf = await getEditorConfiguration(page)
    await expect(page.locator("#recognizer-url")).toHaveText(`connection established at ${conf.server.scheme === "http" ? "ws" : "wss"}://${conf.server.host}/api/v4.0/iink/document?applicationKey=${conf.server.applicationKey}`)
    await expect(page.locator("#recognizer-sent")).toHaveText(`Message sent: ${lastMessageSent}`)
    await expect(page.locator("#recognizer-received")).toHaveText(`Message received: ${lastMessageReceived}`)
  })
})
