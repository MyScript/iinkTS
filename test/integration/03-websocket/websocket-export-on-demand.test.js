const { hello } = require('../strokesDatas')
const { waitForEditorWebSocket, waitEditorIdle, getExportsFromEditorModel, writeStrokes } = require('../helper')

describe('Websocket on-demand export', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_export_on_demand.html')
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket on-demand export')
  })

  test('should not export', async () => {
    await writeStrokes(page, hello.strokes)
    await waitEditorIdle(page)
    const exports = await getExportsFromEditorModel(page)
    expect(exports).toBeUndefined()
    expect(await page.locator("#result").textContent()).toEqual("")
  })

  test('should export on click', async () => {
    await page.click("#export")
    await waitEditorIdle(page)
    const exports = await getExportsFromEditorModel(page)
    const jiix = exports['application/vnd.myscript.jiix']
    expect(jiix.label).toEqual(hello.exports["text/plain"].at(-1))
    expect(await page.locator("#result").textContent()).toEqual(hello.exports["text/plain"].at(-1))
  })
})
