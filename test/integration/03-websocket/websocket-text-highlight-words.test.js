const { waitForEditorWebSocket, write, getExportedDatas } = require("../helper")
const { helloOneSurrounded, helloOneStroke } = require("../strokesDatas")

describe("Websocket Text highlight words", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_highlight_words.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
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
    const list = await page.locator("#highlighted").textContent()
    expect(list).toBe("")
  })

  test('should write, surround and is in list', async () => {
    for (const s of helloOneSurrounded.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
    }
    const element = await page.$('#listOfWords > li')

    const style = await element.evaluate(element => {
        const computedStyle = window.getComputedStyle(element)
        return computedStyle.backgroundColor
    })

    expect(style).toContain("rgb(128, 128, 128)")

  })

  test("should write, surround and is in list then remove from list", async () => {
    for (const s of helloOneSurrounded.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
    }
    const element = await page.$("#listOfWords > li")

    const style = await element.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element)
      return computedStyle.backgroundColor
    })

    expect(style).toContain("rgb(128, 128, 128)")

    await Promise.all([
      getExportedDatas(page),
      write(page, [helloOneSurrounded.strokes[1]])
    ])

    const liElement = await page.$("#listOfWords > li")
    expect(liElement).toBeNull()
  })

  const colorMap = [
    "rgb(0, 0, 0)",
    "rgb(128, 128, 128)",
    "rgb(217, 217, 217)",
    "rgb(26, 140, 255)",
    "rgb(255, 26, 64)",
    "rgb(43, 217, 101)",
    "rgb(255, 221, 51)"
  ]

  for (let index = 0; index < colorMap.length; index++) {
    test(`should write text in color${colorMap[index]} and highlight them`, async () => {
      await Promise.all([
        getExportedDatas(page),
        write(page, [helloOneSurrounded.strokes[0]])
      ])

      await page.locator(`.color${index + 1}`).click()

      await Promise.all([
        getExportedDatas(page),
        write(page, [helloOneSurrounded.strokes[1]])
      ])

      const element = await page.$("#listOfWords > li")

      const style = await element.evaluate((element) => {
        const computedStyle = window.getComputedStyle(element)
        return computedStyle.backgroundColor
      })
      expect(style).toContain(colorMap[index])

      await Promise.all([
        getExportedDatas(page),
        write(page, [helloOneSurrounded.strokes[1]])
      ])

      const liElement = await page.$("#listOfWords > li")
      expect(liElement).toBeNull()
    })
  }

  test("should write in color and surround with another color", async () => {
    await page.locator(".color4").click()
    for (const s of helloOneSurrounded.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
    }
    await page.locator(".color5").click()

    await Promise.all([
      getExportedDatas(page),
      write(page, [helloOneSurrounded.strokes[1]])
    ])

    const element = await page.$("#listOfWords > li")
    const style = await element.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element)
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color
      }
    })
    expect(style.backgroundColor).toContain("rgb(255, 26, 64)")
    expect(style.color).toContain("rgb(26, 140, 255)")
  })

})
