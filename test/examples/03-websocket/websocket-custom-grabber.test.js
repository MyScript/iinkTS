import { test, expect } from "@playwright/test"
import { writeStrokes, waitForEditorInit, callEditorIdle, waitForExportedEvent } from "../helper"
import h from "../__dataset__/h"

test.describe("Websocket custom grabber", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/dev/websocket_custom_grabber.html")
    await waitForEditorInit(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Websocket custom grabber")
  })

  test("should have info empty", async ({ page }) => {
    await expect(page.locator("#pointer-down")).toHaveText("Down at:")
    await expect(page.locator("#pointer-move")).toHaveText("Move to:")
    await expect(page.locator("#pointer-up")).toHaveText("Up at:")
  })

  test("should have information defined after writing", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])
    await expect(page.locator("#result")).toHaveText(h.exports["text/plain"])
    const firstPointer = h.strokes[0].pointers[0]
    const lastPointer = h.strokes[0].pointers.at(-1)

    await expect(page.locator("#pointer-down")).toHaveText(new RegExp(`Down at: {\"x\":${firstPointer.x},\"y\":${firstPointer.y},\"t\":`))
    await expect(page.locator("#pointer-move")).toHaveText(new RegExp(`Move to: {\"x\":${lastPointer.x},\"y\":${lastPointer.y},\"t\":`))
    await expect(page.locator("#pointer-up")).toHaveText(new RegExp(`Up at: {\"x\":${lastPointer.x},\"y\":${lastPointer.y},\"t\":`))
  })

  test("should display alert on right button click", async ({ page }) => {
    const dialogHandled = new Promise((resolve) => {
      const handler = async dialog => {
        await dialog.accept()
        resolve(dialog.message())
      }
      page.on("dialog", handler)
    })

    const dialogPromise = dialogHandled
    await page.locator("#editor").click({ button: "right", position: { x: 100, y: 100} })
    const alertContent = await dialogPromise
    expect(alertContent).toMatch("You have not clicked with only main button.")
    expect(alertContent).toMatch("Secondary button pressed, usually the right button")
  })
})
