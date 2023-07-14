const { testGesture } = require('../_partials/gesture-test')
const { waitForEditorWebSocket, write, getExportedDatas, getEditorModelExportsType } = require('../helper')
const { h } = require('../strokesDatas')

describe('Websocket Text', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_iink.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
    await page.waitForTimeout(1000)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Text')
  })

  test('should export application/vnd.myscript.jiix', async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = exports['application/vnd.myscript.jiix']
    const modelExportJiixReceived = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiixReceived).toEqual(modelExportJiixReceived)
    expect(jiixReceived).toEqual(jiixExpected)
  })

  require('../_partials/nav-actions-test')

  require('../_partials/smart-guide-test')

  testGesture(-100)
})
