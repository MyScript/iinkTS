import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent } from "../helper"
import rectangle from "../__dataset__/rectangle"

test.describe("Interactive ink canvas PlantUML Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_export_plantuml.html`)
    await passModalKey(page)
  })

  test("should start with an empty result", async ({ page }) => {
    await expect(page.locator("#plantUMLResult")).toHaveText("")
  })

  test("should convert a recognized shape to a PlantUML diagram", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    await page.locator("#exportPlantUML").click()

    // The node id comes from the server and isn't stable across runs — only the @startuml/@enduml
    // shell and the shape-to-PlantUML mapping ("rectangle" -> rectangle "rectangle" as ...) are asserted.
    await expect(page.locator("#plantUMLResult")).toHaveText(/^@startuml\nrectangle "rectangle" as \S+\n@enduml$/)
  })

  test("should refresh the diagram on the exported event without pressing anything", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    await expect(page.locator("#plantUMLResult")).toHaveText(/^@startuml\nrectangle "rectangle" as \S+\n@enduml$/)
  })

  test("should download the diagram as a .puml file", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])

    const downloadPromise = page.waitForEvent("download")
    await page.locator("#downloadPlantUML").click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain(".puml")
  })

  test("should clear the result", async ({ page }) => {
    await Promise.all([
      waitForSynchronizedEvent(page),
      writeStrokes(page, rectangle.strokes),
    ])
    await expect(page.locator("#plantUMLResult")).not.toHaveText("")

    await page.locator("#clear").click()

    await expect(page.locator("#plantUMLResult")).toHaveText("")
  })
})
