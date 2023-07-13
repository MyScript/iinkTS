const { write, getExportedDatas, waitForEditorWebSocket, getEditorModelExports } = require("../helper")
const { testGesture } = require("../_partials/gesture-test")
const { h, claclacla } = require("../strokesDatas")

describe("Websocket Text Custom Lexicon", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_custom_lexicon.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Custom lexicon")
  })

  test("should export application/vnd.myscript.jiix", async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    const jiixExpected = h.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived).toEqual(jiixExpected)
  })

  test("should not recognize 'claclacla'", async () => {
    for (const s of claclacla.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
    }

    const exports = await getEditorModelExports(page)
    const jiixExpected = claclacla.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived).not.toEqual(jiixExpected)
  })

  test("should send lexicon data with jiix", async () => {
    await Promise.all([
      waitForEditorWebSocket(page),
      page.locator("#lexicon").fill("claclacla"),
      page.locator("#reinit").click(),
    ])
    await page.waitForTimeout(1000)
    for (const s of claclacla.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s])
      ])
    }

    const exports = await getEditorModelExports(page)
    const jiixExpected = claclacla.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(jiixExpected.label)
  })

  require("../_partials/smart-guide-test")

  testGesture(-100)
})
