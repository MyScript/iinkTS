const { write, getExportedDatas, waitForEditorWebSocket } = require("../helper")
const { testGesture } = require("../_partials/gesture-test")
const { h, klopmo } = require("../strokesDatas")

describe("Websocket Text Custom Lexicon", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_custom_lexicon.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
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

  test("should send lexicon data with klopmo", async () => {
    await page.locator("#lexicon").fill("klopmo")
    await page.click(`#reinit`)
    await waitForEditorWebSocket(page)

    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, klopmo.strokes),
    ])
    const jiixExpected = klopmo.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toStrictEqual(jiixExpected.label)
  })

  require("../_partials/smart-guide-test")

  testGesture(-100)
})
