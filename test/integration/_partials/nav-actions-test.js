const { getExportedDatas, write, getEditorModelExportsType, waitEditorIdle } = require("../helper")
const { h, hello } = require("../strokesDatas")

describe('Nav actions', () => {
  test('should clear', async () => {
    await Promise.all([
      getExportedDatas(page),
      write(page, h.strokes),
    ])
    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBeDefined()

    const [clearExport] = await Promise.all([
      getExportedDatas(page),
      page.click('#clear'),
    ])
    const emptyJiix = { "type": "Text", "label": "", "words": [  ], "version": "3", "id": "MainBlock"}
    const jjixReceived = clearExport['application/vnd.myscript.jiix']
    expect(jjixReceived).toEqual(emptyJiix)

    const modelExportJIIX = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(modelExportJIIX).toEqual(jjixReceived)
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

    await waitEditorIdle(page)

    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

    await Promise.all([
      getExportedDatas(page),
      page.selectOption('#language', 'fr_FR'),
    ])

    await waitEditorIdle(page)

    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })
})
