const { writePointers, waitForEditorWebSocket, getExportsFromEditorModel, waitEditorIdle } = require("../helper")
const { covfefe } = require("../strokesDatas")

describe("Websocket Text Custom Lexicon", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_custom_lexicon.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Custom lexicon")
  })

  test("should not recognize 'covfefe'", async () => {
    await writePointers(page, covfefe.strokes)
    await waitEditorIdle(page)
    const exports = await getExportsFromEditorModel(page)
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).not.toEqual(covfefe.exports["text/plain"].at(-1))
  })

  test("should send lexicon data with jiix", async () => {
    await Promise.all([
      waitForEditorWebSocket(page),
      page.locator("#lexicon").fill("covfefe"),
      page.locator("#reinit").click(),
    ])
    await writePointers(page, covfefe.strokes)
    await waitEditorIdle(page)
    const exports = await getExportsFromEditorModel(page)
    const jiixReceived = exports["application/vnd.myscript.jiix"]
    expect(jiixReceived.label).toEqual(covfefe.exports["text/plain"].at(-1))
  })
})
