const { testGesture } = require('../_partials/gesture-test')
const { waitForEditorWebSocket, write, getExportedDatas } = require('../helper')
const { ponyErase, ponyErasePrecisely } = require('../strokesDatas')

describe('Websocket Text', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_iink_eraser.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Text Eraser')
  })

  test('should toggle mode writing <-> erasing', async () => {
    expect(await page.locator("#pen").isDisabled()).toBe(true)
    expect(await page.locator("#eraser").isDisabled()).toBe(false)
    expect(await page.locator("#editor").getAttribute('class')).not.toContain('erasing')
    await page.click("#eraser")
    expect(await page.locator("#pen").isDisabled()).toBe(false)
    expect(await page.locator("#eraser").isDisabled()).toBe(true)
    expect(await page.locator("#editor").getAttribute('class')).toContain('erasing')
  })

  test('should export erase stroke', async () => {
    const [ponyExports] = await Promise.all([
      getExportedDatas(page),
      write(page, [ponyErase.strokes[0]]),
    ])
    const ponyJiixExpected = ponyErase.exports[0]['application/vnd.myscript.jiix']
    const ponyJiixReceived = ponyExports['application/vnd.myscript.jiix']
    expect(ponyJiixReceived.label).toEqual(ponyJiixExpected.label)

    await page.click("#eraser")

    const [ponyEraseExports] = await Promise.all([
      getExportedDatas(page),
      write(page, [ponyErase.strokes[1]]),
    ])
    const ponyEraseJiixExpected = ponyErase.exports[1]['application/vnd.myscript.jiix']
    const ponyEraseJiixReceived = ponyEraseExports['application/vnd.myscript.jiix']
    expect(ponyEraseJiixReceived.label).toEqual(ponyEraseJiixExpected.label)
  })

  test('should export erase stroke precisely', async () => {
    await Promise.all([
      waitForEditorWebSocket(page),
      page.click("#erase-precisely")
    ])

    await page.waitForTimeout(5000)

    const [ponyExports] = await Promise.all([
      getExportedDatas(page),
      write(page, [ponyErasePrecisely.strokes[0]]),
    ])
    const ponyJiixExpected = ponyErasePrecisely.exports[0]['application/vnd.myscript.jiix']
    const ponyJiixReceived = ponyExports['application/vnd.myscript.jiix']
    expect(ponyJiixReceived.label).toEqual(ponyJiixExpected.label)

    await page.click("#eraser")

    const [ponyEraseExports] = await Promise.all([
      getExportedDatas(page),
      write(page, [ponyErasePrecisely.strokes[1]]),
    ])
    const ponyEraseJiixExpected = ponyErasePrecisely.exports[1]['application/vnd.myscript.jiix']
    const ponyEraseJiixReceived = ponyEraseExports['application/vnd.myscript.jiix']
    expect(ponyEraseJiixReceived.label).toEqual(ponyEraseJiixExpected.label)
  })

  require('../_partials/smart-guide-test')

  testGesture(-100)
})
