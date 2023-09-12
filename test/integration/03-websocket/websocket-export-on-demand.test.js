const { helloHowAreYou } = require('../strokesDatas')
const { waitForEditorWebSocket, waitEditorIdle, getEditorModelExports, write } = require('../helper')

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
    await write(page, helloHowAreYou.strokes)
    await waitEditorIdle(page)
    const exports = await getEditorModelExports(page)
    expect(exports).toBeUndefined()
    expect(await page.locator("#result").textContent()).toEqual("")
  })

  test('should export on click', async () => {
    await page.click("#export")
    await waitEditorIdle(page)
    const exports = await getEditorModelExports(page)
    const jiix = exports['application/vnd.myscript.jiix']
    expect(jiix.label).toEqual(helloHowAreYou.exports["text/plain"].at(-1))
    expect(await page.locator("#result").textContent()).toEqual(helloHowAreYou.exports["text/plain"].at(-1))
  })
})
