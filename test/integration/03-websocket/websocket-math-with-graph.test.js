const { toMatchImageSnapshot } = require('jest-image-snapshot')
const {
  waitForEditorWebSocket,
  write,
  getDatasFromExportedEvent,
  waitEditorIdle
} = require('../helper')
const { equation1 } = require('../strokesDatas')
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

  testIf(!page._browserContext._options.isMobile, 'should draw equation on graph', async () => {
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
