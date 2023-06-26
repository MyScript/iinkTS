const { waitForEditorWebSocket, getEditorConfiguration, setEditorConfiguration, getExportedDatas, write, getEditorModelExports } = require("../helper")
const { helloStrikeStroke } = require("../strokesDatas")

describe('Gesture', () => {
  test('should apply gesture', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.gesture.enable = true
    setEditorConfiguration(page, configuration)
    await waitForEditorWebSocket(page)

    await Promise.all([
      getExportedDatas(page),
      write(page, helloStrikeStroke.strokes),
    ])

    const modelExports = await getEditorModelExports(page)
    jiixExport = JSON.parse(modelExports['application/vnd.myscript.jiix'])
    expect(jiixExport.label).toEqual('')
  })

  test('should not apply gesture', async () => {
    const configuration = await getEditorConfiguration(page)
    configuration.recognition.gesture.enable = false
    setEditorConfiguration(page, configuration)
    await waitForEditorWebSocket(page)

    await Promise.all([
      getExportedDatas(page),
      write(page, helloStrikeStroke.strokes),
    ])

    const modelExports = await getEditorModelExports(page)
    jiixExport = JSON.parse(modelExports['application/vnd.myscript.jiix'])
    expect(jiixExport.label).not.toEqual('')
  })
})
