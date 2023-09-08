const { waitForEditorWebSocket, write, getExportedDatas, waitEditorIdle } = require('../helper')
const { h } = require('../strokesDatas')

describe('Websocket Text Pointer Events', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_pointer_events.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Pointer events')
  })

  test('should export application/vnd.myscript.jiix', async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = exports['application/vnd.myscript.jiix']
    expect(jiixReceived).toEqual(jiixExpected)
  })

  test('should import points with button', async () => {
    const [exports] = await Promise.all([
        getExportedDatas(page),
        page.locator('#pointerEvents').click(),
    ])
    const jiixReceived = exports['application/vnd.myscript.jiix']
    expect(jiixReceived.label).toStrictEqual("A")
  })
})
