import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForExportedEvent,
  callEditorIdle,
  passModalKey,
} from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import helloOneStrokeSurrounded from "../__dataset__/helloOneStrokeSurrounded"
import TextNavActions from "../_partials/text-nav-actions"

const getComputedStyle = async (locator) => {
  return locator.evaluate((el) => {
    const cs = window.getComputedStyle(el)
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
    }
  })
}

const colorMap = [
  {
    id: "black-btn",
    color: "rgb(0, 0, 0)",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  {
    id: "dark-grey-btn",
    color: "rgb(128, 128, 128)",
    backgroundColor: "rgba(128, 128, 128, 0.5)",
  },
  {
    id: "light-grey-btn",
    color: "rgb(217, 217, 217)",
    backgroundColor: "rgba(217, 217, 217, 0.5)",
  },
  {
    id: "blue-btn",
    color: "rgb(26, 140, 255)",
    backgroundColor: "rgba(26, 140, 255, 0.5)",
  },
  {
    id: "red-btn",
    color: "rgb(255, 26, 64)",
    backgroundColor: "rgba(255, 26, 64, 0.5)",
  },
  {
    id: "green-btn",
    color: "rgb(43, 217, 101)",
    backgroundColor: "rgba(43, 217, 101, 0.5)",
  },
  {
    id: "yellow-btn",
    color: "rgb(255, 221, 51)",
    backgroundColor: "rgba(255, 221, 51, 0.5)",
  },
]

test.describe("Websocket Text highlight words", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/websocket/websocket_text_highlight_words.html`)
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Highlight words")
  })

  test('should write and isn"t in list', async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, helloOneStroke.strokes),
    ])
    await callEditorIdle(page)
    await expect(page.locator("#highlight-list > li")).toHaveCount(0)
  })

  test("should write, surround and is in list", async ({ page }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, helloOneStrokeSurrounded.strokes),
    ])
    await callEditorIdle(page)
    await expect(page.locator("#highlight-list > li")).toHaveCount(1)
    const style = await getComputedStyle(page.locator("#highlight-list > li"))
    expect(style.backgroundColor).toContain("rgba(0, 0, 0, 0.5)")
  })

  test("should write, surround and is in list then remove from list", async ({
    page,
  }) => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, helloOneStrokeSurrounded.strokes),
    ])
    await callEditorIdle(page)
    await expect(page.locator("#highlight-list > li")).toHaveCount(1)
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloOneStrokeSurrounded.strokes[1]]),
    ])
    await expect(page.locator("#highlight-list > li")).toHaveCount(0)
  })

  for (let index = 0; index < colorMap.length; index++) {
    test(`should write text in color ${colorMap[index].color} and highlight them`, async ({
      page,
    }) => {
      const currentColor = colorMap[index]
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloOneStrokeSurrounded.strokes[0]]),
      ])
      await page.locator(`#${currentColor.id}`).click()
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloOneStrokeSurrounded.strokes[1]]),
      ])
      await expect(page.locator("#highlight-list > li")).toHaveCount(1)

      const style = await getComputedStyle(page.locator("#highlight-list > li"))
      expect(style.backgroundColor).toContain(currentColor.backgroundColor)
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, [helloOneStrokeSurrounded.strokes[1]]),
      ])
      await expect(page.locator("#highlight-list > li")).toHaveCount(0)
    })
  }

  test("should write in color and surround with another color", async ({
    page,
  }) => {
    const strokeColor = colorMap[4]
    const highlightColor = colorMap[5]
    await page.click(`#${strokeColor.id}`)
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloOneStrokeSurrounded.strokes[0]]),
    ])
    await callEditorIdle(page)
    await expect(page.locator("#highlight-list > li")).toHaveCount(0)

    await page.click(`#${highlightColor.id}`)
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, [helloOneStrokeSurrounded.strokes[1]]),
    ])
    await callEditorIdle(page)
    await expect(page.locator("#highlight-list > li")).toHaveCount(1)
    const style = await getComputedStyle(page.locator("#highlight-list > li"))
    expect(style.backgroundColor).toContain(highlightColor.backgroundColor)
    expect(style.color).toContain(strokeColor.color)
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
