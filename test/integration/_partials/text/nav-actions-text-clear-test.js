const { getExportsFromEditorModel, write, getDatasFromExportedEvent, waitEditorIdle, waitForEditorWebSocket } = require("../../helper")
const { h } = require("../../strokesDatas")

describe('Nav actions text clear', () => {
  test('should clear', async () => {
    await waitForEditorWebSocket(page)
    await write(page, h.strokes)
    await page.click("#clear")

    const [exportAfterClear] = await Promise.all([
      getDatasFromExportedEvent(page)
    ])

    const emptyJiix = { "type": "Text", "label": "", "words": [  ], "version": "3", "id": "MainBlock"}
    expect(exportAfterClear["application/vnd.myscript.jiix"]).toEqual(emptyJiix)
    expect(exportAfterClear["application/vnd.myscript.jiix"].label).toStrictEqual('')
  })
})
