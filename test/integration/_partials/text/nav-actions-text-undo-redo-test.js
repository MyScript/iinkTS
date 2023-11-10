const { getExportsFromEditorModel, write, getDatasFromExportedEvent, waitEditorIdle } = require("../../helper")
const { hello } = require("../../strokesDatas")

describe('Nav actions text undo/redo', () => {
  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitEditorIdle(page)
  })

  test('should undo/redo', async () => {
    const editorEl = await page.waitForSelector('#editor')
    for (const s of hello.strokes) {
      await Promise.all([
        write(page, [s]),
        getDatasFromExportedEvent(page),
      ])
    }
    let resultElement = await getExportsFromEditorModel(page)
    expect(resultElement['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-1))
    let raw = await editorEl.evaluate((node) => node.editor.model.strokes)
    expect(raw.length).toStrictEqual(hello.strokes.length)

    await Promise.all([getExportsFromEditorModel(page), page.click('#undo')])
    resultElement = await getExportsFromEditorModel(page)
    expect(resultElement['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-2))
    raw = await editorEl.evaluate((node) => node.editor.model.strokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 1)

    await Promise.all([getExportsFromEditorModel(page), page.click('#undo')])
    resultElement = await getExportsFromEditorModel(page)
    expect(resultElement['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-3))
    raw = await editorEl.evaluate((node) => node.editor.model.strokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 2)

    await Promise.all([getExportsFromEditorModel(page), page.click('#redo')])
    resultElement = await getExportsFromEditorModel(page)
    expect(resultElement['application/vnd.myscript.jiix'].label).toStrictEqual(hello.exports['text/plain'].at(-2))
    raw = await editorEl.evaluate((node) => node.editor.model.strokes)
    expect(raw.length).toStrictEqual(hello.strokes.length - 1)
  })
})
