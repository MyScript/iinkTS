const { writeStrokesPointers, getDatasFromExportedEvent, waitEditorIdle } = require("../../helper")
const { one } = require("../../strokesDatas")

describe('Nav actions text clear', () => {
  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitEditorIdle(page)
  })

  test('should clear', async () => {
    const [exportBeforeClear] = await Promise.all([
      getDatasFromExportedEvent(page),
      writeStrokesPointers(page, one.strokes, 100)
    ])
    expect(exportBeforeClear["application/vnd.myscript.jiix"].label).toStrictEqual("1")

    const [exportAfterClear] = await Promise.all([
      getDatasFromExportedEvent(page),
      page.click("#clear")
    ])
    const emptyJiix = { "type": "Text", "label": "", "words": [], "version": "3", "id": "MainBlock" }
    expect(exportAfterClear["application/vnd.myscript.jiix"]).toEqual(emptyJiix)
    expect(exportAfterClear["application/vnd.myscript.jiix"].label).toStrictEqual('')
  })
})
