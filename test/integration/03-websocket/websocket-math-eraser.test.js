
const { waitForEditorWebSocket } = require('../helper')

describe('Websocket Math Eraser', function () {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_math_iink_eraser.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Websocket Math Eraser')
  })
})
