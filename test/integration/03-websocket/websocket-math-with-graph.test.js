const { toMatchImageSnapshot } = require('jest-image-snapshot')
const {
  waitForEditorWebSocket,
  write,
  getDatasFromExportedEvent,
  getExportsTypeFromEditorModel,
  waitEditorIdle
} = require('../helper')
const { equation1, fence, sum } = require('../strokesDatas')
expect.extend({ toMatchImageSnapshot })

describe('Websocket Math', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_with_graph.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math With Graph')
  })

  test('should only export latex by default', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s], 100, 100)
      ])
    }
    const jiix = await getExportsTypeFromEditorModel(page, 'application/vnd.myscript.jiix')
    expect(jiix).toBeUndefined()
    const latex = await getExportsTypeFromEditorModel(page, 'application/x-latex')
    expect(latex).toBeDefined()
    const mathml = await getExportsTypeFromEditorModel(page, 'application/mathml+xml')
    expect(mathml).toBeUndefined()
  })

  test('should draw equation on graph', async () => {
    for(const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        write(page, [s], 100, 100)
      ])
    }
    const img = await page.screenshot()
    expect(img).toMatchImageSnapshot({ failureThreshold: 0.01, failureThresholdType: 'percent' })
  })

  require("../_partials/math/nav-actions-math-undo-redo-test")
})
