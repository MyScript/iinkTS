const { getExportedDatas, write, getEditor } = require("../helper")
const { h, hello } = require("../strokesDatas")

describe('Nav actions', () => {
  test('should clear', async () => {
    const [exportedDatas] = await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    const jiixReceived = JSON.parse(exportedDatas['application/vnd.myscript.jiix'])
    expect(resultText).toStrictEqual(jiixReceived.label)

    const promisesResult = await Promise.all([
      getExportedDatas(page),
      page.click('#clear'),
    ])
    const emptyJiix = { "type": "Text", "label": "", "words": [  ], "version": "3", "id": "MainBlock"}
    const jjixReceived = JSON.parse(promisesResult[0]['application/vnd.myscript.jiix'])

    expect(jjixReceived).toEqual(emptyJiix)
    const editor = await getEditor(page)
    expect(JSON.parse(editor.model.exports['application/vnd.myscript.jiix'])).toEqual(jjixReceived)
    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })

  test('should undo/redo', async () => {
    const editorEl = await page.waitForSelector('#editor')
    for(const s of hello.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s]),
      ])
    }

    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-1))

    let raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length)

    await Promise.all([getExportedDatas(page), page.click('#undo')])
    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-2))

    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 1)

    await Promise.all([getExportedDatas(page), page.click('#undo')])
    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-3))

    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 2)

    await Promise.all([getExportedDatas(page), page.click('#redo')])
    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(hello.exports['text/plain'].at(-2))

    raw = await editorEl.evaluate((node) => node.editor.model.rawStrokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 1)
  })

  test('should change language', async () => {
    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])

    //await css animation
    await page.waitForTimeout(1500)

    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

    await Promise.all([
      getExportedDatas(page),
      page.selectOption('#language', 'fr_FR'),
    ])

    //await css animation
    await page.waitForTimeout(1500)

    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })
})
