import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, callCanvasIdle, pollJiix } from "../helper"
import dataset from "../__dataset__/diagram_connections"

test.describe("Interactive ink canvas diagram inspector", { tag: "@slow" }, () => {
  // Replaying the diagram dataset takes close to a minute on a loaded WebKit run
  test.describe.configure({ timeout: 120 * 1000 })

  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_diagram_inspector.html`
    )
    await passModalKey(page)
  })

  test("should start with an empty graph", async ({ page }) => {
    await expect(page.locator("#graph-summary")).toContainText("Nothing recognized yet")
    await expect(page.locator("#nodes-list")).toContainText("No shape recognized yet")
    await expect(page.locator("#edges-list")).toContainText("No line or arc recognized yet")
  })

  test("should list the recognized nodes and edges, and highlight the ink behind a hovered entry", async ({
    page,
  }) => {
    // Dataset: rectangle, a line edge, a circle, a 2-stroke arrow edge, and a second rectangle —
    // 3 nodes and 2 edges once recognized.
    await writeStrokes(page, dataset.strokes)
    await callCanvasIdle(page)
    await pollJiix(page, 5, 20000)

    await expect(page.locator("#graph-summary")).toContainText("3 node(s) · 2 edge(s)")
    await expect(page.locator("#nodes-list .graph-item")).toHaveCount(3)
    await expect(page.locator("#edges-list .graph-item")).toHaveCount(2)

    // Both edges touch a shape on each end in this dataset, so none of them may be reported
    // as dangling.
    await expect(page.locator("#edges-list .graph-item.dangling")).toHaveCount(0)

    await page.locator("#nodes-list .graph-item").first().hover()
    await expect(page.locator("#rootEl .inspector-hover-highlight").first()).toBeAttached()
  })
})
