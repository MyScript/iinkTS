const { getExportedDatas, write, waitEditorLoaded, getEditor } = require("../helper")
const { h, hello } = require("../strokesDatas")

describe('Nav actions', () => {
  test('should clear', async () => {
    // await first empty export
    await getExportedDatas(page)

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
    expect(editor.model.exports).toBeUndefined()

    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })

  test('should undo/redo', async () => {
    // await first empty export
    await getExportedDatas(page)

    const editorEl = await page.waitForSelector('#editor')
    await Promise.all([
      getExportedDatas(page),
      write(page, hello.strokes),
    ])

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
    // await first empty export
    await getExportedDatas(page)

    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

    await Promise.all([
      getExportedDatas(page),
      page.selectOption('#language', 'fr_FR'),
    ])

    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })
})
