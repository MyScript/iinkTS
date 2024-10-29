const { waitForEditorWebSocket, waitForExportedEvent, waitEditorIdle } = require('../helper')

describe('Websocket Text Pointer Events', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_pointer_events.html')
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Pointer events')
  })

  test('should import points with button', async () => {
    const [exports] = await Promise.all([
        waitForExportedEvent(page),
        page.locator('#pointerEvents').click(),
    ])
    const jiixReceived = exports['application/vnd.myscript.jiix']
    expect(jiixReceived.label).toStrictEqual("A")
  })
})
