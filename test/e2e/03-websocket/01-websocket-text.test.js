const {
  write,
  getExportedDatas,
  waitEditorLoaded
} = require('../helper')
const {
  h,
  hello,
  helloOneStroke,
  helloStrikeStroke,
} = require('../strokesDatas')

describe('Websocket Text', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_iink.html')
  })

  beforeEach(async () => {
    await page.reload()
    await waitEditorLoaded(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Text iink')
  })

  test('should export application/vnd.myscript.jiix', async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    const jiixExpected = h.exports['application/vnd.myscript.jiix']
    const jiixReceived = JSON.parse(exports['application/vnd.myscript.jiix'])
    expect(jiixReceived).toStrictEqual(jiixExpected)
  })


  require('../_partials/nav-actions-test')

  require('../_partials/smart-guide-test')

  require('../_partials/gesture-test')

})
