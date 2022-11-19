const { getEditorConfiguration, setEditorConfiguration, waitEditorLoaded, getExportedDatas, write } = require("../helper")
const { helloStrikeStroke } = require("../strokesDatas")

describe('Gesture', () => {
  test('should apply gesture', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.gesture.enable = true
    setEditorConfiguration(page, configuration)
    await waitEditorLoaded(page)

    await write(page, helloStrikeStroke.strokes,)
    const myExports = await getExportedDatas(page)

    jiixExport = JSON.parse(myExports['application/vnd.myscript.jiix'])
    expect(jiixExport.label).toEqual('')
  })

  test('should not apply gesture', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.gesture.enable = false
    setEditorConfiguration(page, configuration)
    await waitEditorLoaded(page)

    await write(page, helloStrikeStroke.strokes)
    const myExports = await getExportedDatas(page)

    jiixExport = JSON.parse(myExports['application/vnd.myscript.jiix'])
    expect(jiixExport.label).not.toEqual('')
  })
})