const { waitForEditorWebSocket, getEditorConfiguration, setEditorConfiguration, getExportedDatas, write, getEditorModelExports } = require("../helper")
const { helloStrikeStroke } = require("../strokesDatas")


module.exports.testGesture = (offsetTop = 0, offsetLeft = 0) => {
  describe('Gesture', () => {
    test('should apply gesture', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = true
      setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)

      const [firstModelExports] = await Promise.all([
        getExportedDatas(page),
        write(page, [helloStrikeStroke.strokes[0]], offsetTop, offsetLeft),
      ])
      const firstJiixExport = firstModelExports['application/vnd.myscript.jiix']
      expect(firstJiixExport.label).toEqual(helloStrikeStroke.exports['text/plain'][0])

      const [secondModelExports] = await Promise.all([
        getExportedDatas(page),
        write(page, [helloStrikeStroke.strokes[1]], offsetTop, offsetLeft),
      ])
      const secondJiixExport = secondModelExports['application/vnd.myscript.jiix']
      expect(secondJiixExport.label).toEqual('')
    })

    test('should not apply gesture', async () => {
      const configuration = await getEditorConfiguration(page)
      configuration.recognition.gesture.enable = false
      setEditorConfiguration(page, configuration)
      await waitForEditorWebSocket(page)

      const [firstModelExports] = await Promise.all([
        getExportedDatas(page),
        write(page, [helloStrikeStroke.strokes[0]], offsetTop, offsetLeft),
      ])
      const firstJiixExport = firstModelExports['application/vnd.myscript.jiix']
      expect(firstJiixExport.label).toEqual(helloStrikeStroke.exports['text/plain'][0])

      const [secondModelExports] = await Promise.all([
        getExportedDatas(page),
        write(page, [helloStrikeStroke.strokes[1]], offsetTop, offsetLeft),
      ])
      const secondJiixExport = secondModelExports['application/vnd.myscript.jiix']
      expect(secondJiixExport.label).not.toEqual('')
    })
  })
}
