import { test, expect } from "@playwright/test"
import { writeStrokes } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"

// tldraw draws on a canvas: the shapes are read through the editor the example exposes
const readShapes = (page) => page.evaluate(() => ({
  ids: window.tldrawEditor.getCurrentPageShapes().map(s => s.id),
  hintingIds: window.tldrawEditor.getHintingShapeIds(),
}))

test.describe("TLDraw WebSocket client", { tag: "@minimal" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/custom-rendering/tldraw-websocket-client/dist/index.html`)
    if(await page.getByRole('textbox', { name: 'Host:' }).isVisible()) {

      await page.getByLabel('Scheme:').selectOption(process.env.SCHEME)
      await page.getByRole('textbox', { name: 'Host:' }).fill(process.env.HOST)
      await page.getByRole('textbox', { name: 'Application Key:' }).fill(process.env.APPLICATION_KEY)
      await page.getByRole('textbox', { name: 'HMAC Key:' }).fill(process.env.HMAC_KEY)
      await page.getByRole('button', { name: 'Save' }).click()
    }
    else
    {
      await page.getByTestId('main-menu.button').click()
    }

    await expect(page.locator('.loader')).toBeHidden({ timeout: 5_000 })

    // Below 1200px the recognition panel is an overlay, closed until its header button opens it
    const resultsToggle = page.locator('button[aria-controls="results-panel"]')
    if (await resultsToggle.isVisible()) {
      await resultsToggle.click()
    }
    await expect(page.locator('#results-panel')).toBeInViewport()
  })

  test("recognition panel should be empty", async ({ page }) => {
    await expect(page.locator('#recognition-elements li')).toHaveCount(0)
    await expect(page.locator('#recognition-jiix')).toHaveCount(0)
  })

  test("recognition panel should be updated after writing", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)

    // The JIIX export only lands once the server has answered the write (seen slow on Firefox in CI)
    await expect(page.locator('#recognition-elements')).toContainText("hello", { timeout: 15_000 })
    await expect(page.locator('#recognition-jiix')).toContainText('"type": "Raw Content"')
    await expect(page).toHaveScreenshot({ name: "tldraw-hello-recognition.png" })
  })

  test("should hint the strokes of the hovered recognized element", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    const item = page.locator('#recognition-elements li', { hasText: "hello" })
    await expect(item).toBeVisible({ timeout: 15_000 })
    const { ids } = await readShapes(page)

    await item.hover()
    await expect.poll(async () => (await readShapes(page)).hintingIds).toEqual(ids)

    await page.locator('#recognition-jiix').hover()
    await expect.poll(async () => (await readShapes(page)).hintingIds).toEqual([])
  })

  test("should undo and redo", async ({ page }) => {
    await writeStrokes(page, helloOneStroke.strokes)
    const recognitionElements = page.locator('#recognition-elements')
    await expect(recognitionElements).toContainText("hello", { timeout: 15_000 })

    await page.locator('button[data-testid="quick-actions.undo"]').click()
    await expect(recognitionElements.locator('li')).toHaveCount(0)

    await page.locator('button[data-testid="quick-actions.redo"]').click()
    await expect(recognitionElements).toContainText("hello")
  })
})
