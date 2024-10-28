const { toMatchImageSnapshot } = require('jest-image-snapshot')
const {
  waitForEditorWebSocket,
  writeStrokes,
  getDatasFromExportedEvent,
  waitEditorIdle
} = require('../helper')
const { equation1 } = require('../strokesDatas')
expect.extend({ toMatchImageSnapshot })

describe('Websocket Math', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_with_graph.html')
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math With Graph')
  })

  test('should draw equation on graph', async () => {
    for (const s of equation1.strokes) {
      await Promise.all([
        getDatasFromExportedEvent(page),
        writeStrokes(page, [s], 100, 100)
      ])
    }
    const img = await page.screenshot()

    // To update the snapshot, uncomment the following 2 lines
    //const fs = require('fs')
    //fs.writeFile(__dirname + '/../__image_snapshots__/websocket-math-with-graph-test-js-snapshot.png', img, (err) => err && console.error(err));

    expect(img).toMatchImageSnapshot({

      allowSizeMismatch: true,
      customSnapshotsDir: '../__image_snapshots__',
      customSnapshotIdentifier: 'websocket-math-with-graph-test-js-snapshot.png',
      failureThreshold: 0.01,
      failureThresholdType: 'percent'
    })
  })

  require("../_partials/math/nav-actions-math-clear-test")
  require("../_partials/math/nav-actions-math-undo-redo-test")
})
