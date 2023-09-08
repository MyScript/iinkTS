const { write, waitForEditorWebSocket, getEditorModelExports, waitEditorIdle } = require("../helper")
const { claclacla } = require("../strokesDatas")

describe("Websocket Text Custom Lexicon", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_custom_lexicon.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Custom lexicon")
  })

  test("should not recognize 'claclacla'", async () => {
    await write(page, claclacla.strokes)
    await waitEditorIdle(page)
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
    await write(page, claclacla.strokes)
    await waitEditorIdle(page)
    const exports = await getEditorModelExports(page)
    const jiixExpected = claclacla.exports["application/vnd.myscript.jiix"]
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(jiixExpected.label)
  })
})
