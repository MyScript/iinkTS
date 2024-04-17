const { waitForEditorWebSocket, write, getDatasFromExportedEvent, waitEditorIdle } = require("../helper")
const { helloOneSurrounded, helloOneStroke } = require("../strokesDatas")

const getComputedStyle = async (locator) => {
  return locator.evaluate((el) => {
    const cs = window.getComputedStyle(el)
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor
    }
  })
}

const colorMap = [
  {
    id: "black-btn",
    color: "rgb(0, 0, 0)"
  },
  {
    id: "dark-grey-btn",
    color: "rgb(128, 128, 128)"
  },
  {
    id: "light-grey-btn",
    color: "rgb(217, 217, 217)"
  },
  {
    id: "blue-btn",
    color: "rgb(26, 140, 255)"
  },
  {
    id: "red-btn",
    color: "rgb(255, 26, 64)"
  },
  {
    id: "green-btn",
    color: "rgb(43, 217, 101)"
  },
  {
    id: "yellow-btn",
    color: "rgb(255, 221, 51)"
  },

]

describe("Websocket Text highlight words", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_highlight_words.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Highlight words')
  })

  test('should write and isn\'t in list', async () => {
    await Promise.all([
      write(page, helloOneStroke.strokes),
    ])
    await waitEditorIdle(page)
    expect(await page.locator("#highlight-list > li").count()).toEqual(0)
  })

  test('should write, surround and is in list', async () => {
    await Promise.all([
      write(page, helloOneSurrounded.strokes),
    ])
    await waitEditorIdle(page)
    expect(await page.locator("#highlight-list > li").count()).toEqual(1)
    const style = await getComputedStyle(page.locator("#highlight-list > li"))
    expect(style.backgroundColor).toContain("rgb(0, 0, 0)")
  })

  test("should write, surround and is in list then remove from list", async () => {
    expect(await page.locator("#highlight-list > li").count()).toEqual(0)
    await Promise.all([
      write(page, helloOneSurrounded.strokes),
    ])
    await waitEditorIdle(page)
    expect(await page.locator("#highlight-list > li").count()).toEqual(1)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, [helloOneSurrounded.strokes[1]])
    ])
    expect(await page.locator("#highlight-list > li").count()).toEqual(0)
  })

  for (let index = 0; index < colorMap.length; index++) {
    test(`should write text in color ${colorMap[index].id} and highlight them`, async () => {
      const currentColor = colorMap[index]
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [helloOneSurrounded.strokes[0]])
      ])
      await page.locator(`#${currentColor.id}`).click()
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [helloOneSurrounded.strokes[1]])
      ])
      expect(await page.locator("#highlight-list > li").count()).toEqual(1)

      const style = await getComputedStyle(page.locator("#highlight-list > li"))
      expect(style.backgroundColor).toContain(currentColor.color)
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [helloOneSurrounded.strokes[1]])
      ])
      expect(await page.locator("#highlight-list > li").count()).toEqual(0)
    })
  }

  test("should write in color and surround with another color", async () => {
    const strokeColor = colorMap[4]
    const highlightColor = colorMap[5]
    await page.click(`#${strokeColor.id}`)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, [helloOneSurrounded.strokes[0]])
    ])
    await waitEditorIdle(page)
    expect(await page.locator("#highlight-list > li").count()).toEqual(0)

    await page.click(`#${highlightColor.id}`)
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, [helloOneSurrounded.strokes[1]])
    ])
    await waitEditorIdle(page)
    expect(await page.locator("#highlight-list > li").count()).toEqual(1)
    const style = await getComputedStyle(page.locator("#highlight-list > li"))
    expect(style.backgroundColor).toContain(highlightColor.color)
    expect(style.color).toContain(strokeColor.color)
  })
  require("../_partials/text/nav-actions-text-undo-redo-test")
})
