const { waitForEditorWebSocket, write, getExportedDatas, getEditorModelExportsType, waitEditorIdle } = require('../helper')
const { helloOneStroke } = require('../strokesDatas')

describe('Websocket Text local storage', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_local_storage_text.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('WEBSOCKET Text iink')
  })

  test('should export text/plain', async () => {
    const [exports] = await Promise.all([
      getExportedDatas(page),
      write(page, helloOneStroke.strokes),
    ])
    //add delay to save text in localstorage
    await page.waitForTimeout(400)
    const jiixExpected = helloOneStroke.exports['text/plain'][0]
    const jiixReceived = exports['text/plain']
    await page.locator("#clearStorage").click()
    expect(jiixReceived).toStrictEqual(jiixExpected)
  })

  test('should get hello in localstorage', async () => {
    await page.locator("#clearStorage").click()
      await Promise.all([
        getExportedDatas(page),
        write(page, helloOneStroke.strokes)
      ])

      await page.reload({ waitUntil: "networkidle" })
      await waitForEditorWebSocket(page)
      await waitEditorIdle(page)

      const exports = await getEditorModelExportsType(page, "application/vnd.myscript.jiix")
      expect(exports.label).toEqual("hello")
  })
})
