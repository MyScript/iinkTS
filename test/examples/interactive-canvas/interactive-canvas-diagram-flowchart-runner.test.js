import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, callCanvasIdle, pollJiix } from "../helper"
import dataset from "../__dataset__/diagram_connections"

test.describe("Interactive ink canvas flowchart runner", { tag: "@slow" }, () => {
  // Replaying the diagram dataset takes close to a minute on a loaded WebKit run
  test.describe.configure({ timeout: 120 * 1000 })

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_diagram_flowchart_runner.html`
    )
    await passModalKey(page)
  })

  test("should start idle", async ({ page }) => {
    await expect(page.locator("#runner-state")).toContainText("Draw a flowchart")
    await expect(page.locator("#runner-trace")).toContainText("Nothing yet")
  })

  test("should walk the recognized diagram step by step", async ({ page }) => {
    // Dataset: rectangle, a line edge, a circle, a 2-stroke arrow edge, and a second rectangle.
    // Whatever direction the server reports for those edges, the node the run starts on has no
    // incoming edge and therefore at least one way out.
    await writeStrokes(page, dataset.strokes)
    await callCanvasIdle(page)
    await pollJiix(page, 5, 20000)

    await page.locator("#runBtn").click()

    await expect(page.locator("#runner-state")).toContainText("Now at:")
    await expect(page.locator("#runner-trace .runner-step")).toHaveCount(1)
    // The step the run stands on is outlined on the ink itself.
    await expect(page.locator("#rootEl .runner-current-highlight").first()).toBeAttached()

    const choices = page.locator("#runner-choices .runner-choice")
    await expect(choices.first()).toBeVisible()
    await choices.first().click()

    await expect(page.locator("#runner-trace .runner-step")).toHaveCount(2)
    // The edge just taken is outlined too, alongside the new current step.
    await expect(page.locator("#rootEl .runner-edge-highlight").first()).toBeAttached()

    await page.locator("#resetBtn").click()

    await expect(page.locator("#runner-trace")).toContainText("Nothing yet")
    await expect(page.locator("#rootEl .runner-current-highlight")).toHaveCount(0)
  })
})
