
const { waitForEditorWebSocket, write, getExportedDatas, getEditorModelExportsType, getStrokesFromJIIX, getEditorConfiguration, setEditorConfiguration } = require('../helper')
const { equation1, fence } = require('../strokesDatas')

describe('Websocket Math', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_iink.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'networkidle'})
    await waitForEditorWebSocket(page)
    await page.waitForTimeout(1000)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math')
  })

  test('should only export latex by default', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export jiix', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix']
    config.recognition.export.jiix.strokes = true
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    const mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should only export mathml+xml', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/mathml+xml']
    config.recognition.export.jiix.strokes = true
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toBeUndefined()
    let mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    //remove new line
    mathml = mathml.replace(/[\r\n]+/gm, "")
    //remove space between ><
    mathml = mathml.replace(/>\s*</gm, "><")
    expect(mathml).toEqual(equation1.exports.MATHML.STANDARD)
  })

  test('should undo/redo in mode stroke by default', async () => {
    const config = await getEditorConfiguration(page)
    expect(config.recognition.math['undo-redo'].mode).toEqual('stroke')
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix', 'application/x-latex']
    config.recognition.export.jiix.strokes = true
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    let exports
    let jiix
    let nbStroke = 0
    for(const s of equation1.strokes) {
      nbStroke++
      [exports] = await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
      jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
      expect(getStrokesFromJIIX(jiix).length).toEqual(nbStroke)
      expect(exports['application/vnd.myscript.jiix']).toEqual(jiix)
    }
    let latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])

    const clearPromises = await Promise.all([
      getExportedDatas(page),
      page.click('#clear')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(clearPromises[0]['application/x-latex']).toEqual(latex)
    expect(latex).toEqual('')

    const undo1Promises = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(undo1Promises[0]['application/vnd.myscript.jiix']).toEqual(jiix)
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)

    const undo2Promises =  await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(undo2Promises[0]['application/vnd.myscript.jiix']).toEqual(jiix)
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length - 1)

    const undo3Promises = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(undo3Promises[0]['application/vnd.myscript.jiix']).toEqual(jiix)
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length - 2)

    const redoPromises = await Promise.all([
      getExportedDatas(page),
      page.click('#redo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(redoPromises[0]['application/vnd.myscript.jiix']).toEqual(jiix)
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length - 1)
  })

  test('should undo/redo in mode session', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix', 'application/x-latex']
    config.recognition.export.jiix.strokes = true
    config.recognition.math['undo-redo'].mode = 'session'
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    await Promise.all([
      getExportedDatas(page),
      write(page, equation1.strokes, 100, 100)
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    let jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)
    let latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])

    const clearPromises = await Promise.all([
      getExportedDatas(page),
      page.click('#clear')
    ])
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(clearPromises[0]['application/x-latex']).toEqual(latex)
    expect(latex).toEqual('')

    const undo1Promises = await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(undo1Promises[0]['application/vnd.myscript.jiix']).toEqual(jiix)
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)

    const undo2Promises =  await Promise.all([
      getExportedDatas(page),
      page.click('#undo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(undo2Promises[0]['application/x-latex']).toEqual(latex)
    expect(latex).toEqual('')

    const redoPromises = await Promise.all([
      getExportedDatas(page),
      page.click('#redo')
    ])
    //TODO remove when waitForIdle implemented
    await page.waitForTimeout(500)
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(redoPromises[0]['application/vnd.myscript.jiix']).toEqual(jiix)
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])
  })

  test('should convert with equation1', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix', 'application/x-latex']
    config.recognition.export.jiix.strokes = true
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of equation1.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)
    const latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])

    await Promise.all([
      getExportedDatas(page),
      page.click('#convert')
    ])
    const latexConv = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latexConv).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])
  })

  test('should math flavor with fences', async () => {
    const config = await getEditorConfiguration(page)
    config.recognition.math.mimeTypes = ['application/vnd.myscript.jiix', 'application/x-latex', 'application/mathml+xml']
    config.recognition.export.jiix.strokes = true
    config.recognition.export.mathml = { flavor: 'standard' }
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of fence.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 175)
      ])
    }

    let jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(fence.strokes.length)

    let mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(fence.exports.MATHML.STANDARD[fence.exports.MATHML.STANDARD.length - 1].trim().replace(/ /g, ''))

    await Promise.all([
      getExportedDatas(page),
      page.click('#clear')
    ])

    config.recognition.export.mathml = { flavor: 'ms-office' }
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    for(const s of fence.strokes) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [s], 100, 175)
      ])
    }

    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(fence.strokes.length)
    mathml = await getEditorModelExportsType(page, 'application/mathml+xml')
    expect(mathml.trim().replace(/ /g, '')).toEqual(fence.exports.MATHML.MSOFFICE[fence.exports.MATHML.MSOFFICE.length - 1].trim().replace(/ /g, ''))
  })

  test('should each label of strokes', async () => {
    for (const [index, strokes] of equation1.strokes.entries()) {
      await Promise.all([
        getExportedDatas(page),
        write(page, [strokes], 100, 100)
      ])
      const latex = await getEditorModelExportsType(page, 'application/x-latex')
      expect(latex).toEqual(equation1.exports.LATEX[index])
    }
  })

  //TODO undo-redo after reconnect
  // issue MSIS-5118 => undo does not work after restore session
  test.skip('should undo/redo with reconnect', async () => {
    const editorEl = await page.waitForSelector('#editor')
    const isInit = await isEditorInitialized(editorEl)
    expect(isInit).toEqual(true)

    await write(page, equation1.strokes, 100, 100)
    await page.evaluate(exported)

    let jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)
    let latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])

    const clearClick = page.click('#clear')
    const exportedEvent = page.evaluate(exported)
    await Promise.all([clearClick, exportedEvent])
    const exports = await editorEl.evaluate(node => node.editor.model.exports)
    if (exports !== undefined) {
      expect(exports['application/x-latex']).toEqual('')
    }

    await editorEl.evaluate((node) => {
      node.editor.recognizer.close(node.editor.recognizerContext, node.editor.model)
        .then(() => console.log('socket closed'))
    })

    for (const strokes of equation1.strokes) {
      await write(page, [strokes], 100, 100)
      await page.evaluate(exported)
    }
    jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
    expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length)
    latex = await getEditorModelExportsType(page, 'application/x-latex')
    expect(latex).toEqual(equation1.exports.LATEX[equation1.exports.LATEX.length - 1])

    for (const [index] of equation1.strokes.entries()) {
      const undoElement = await page.waitForSelector('#undo')
      const disabled = await undoElement.evaluate(node => node.disabled)
      if (disabled) {
        const exports = await editorEl.evaluate(node => node.editor.model.exports)
        expect(exports).toEqual(undefined)
      } else {
        await undoElement.click()
        await page.evaluate(exported)
        jiix = await getEditorModelExportsType(page, 'application/vnd.myscript.jiix')
        latex = await getEditorModelExportsType(page, 'application/x-latex')
        expect(getStrokesFromJIIX(jiix).length).toEqual(equation1.strokes.length - index - 1)
      }
    }
  })
})
