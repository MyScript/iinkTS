const {
  waitForEditorRest,
  waitForExportedEvent,
  writeStrokes
} = require('../helper')
const { h } = require('../strokesDatas')

describe('Rest Text', () => {

  beforeAll(async () => {
    await page.goto('/examples/dev/rest_custom_grabber.html')
    await waitForEditorRest(page)
  })


  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest custom grabber')
  })

  test("should have info in point-info div", async () => {
    const pointerDown = await page.$eval("#pointer-down", el => el.textContent)
    expect(pointerDown).toContain("Down at:")
    const pointerMove = await page.$eval("#pointer-move", el => el.textContent)
    expect(pointerMove).toContain("Move to:")
    const pointerUp = await page.$eval("#pointer-up", el => el.textContent)
    expect(pointerUp).toContain("Up at:")
  })

  test("should have info in recognizer-info div", async () => {
    await Promise.all([
      waitForExportedEvent(page),
      writeStrokes(page, h.strokes)
    ])
    const result = await page.$eval("#result", el => el.textContent)
    expect(result.match("h"))

    const pointerDown = await page.$eval("#pointer-down", el => el.textContent)
    expect(pointerDown).toContain("Down at: {\"x\":397,\"y\":254,\"t\":")

    const pointerMove = await page.$eval("#pointer-move", el => el.textContent)
    expect(pointerMove).toContain("Move to: {\"x\":426,\"y\":250,\"t\":")

    const pointerUp = await page.$eval("#pointer-up", el => el.textContent)
    expect(pointerUp).toContain("Up at: {\"x\":426,\"y\":250,\"t\":")
  })

  test.skip("should display alert on right button click", async () => {
    const dialogHandled = new Promise((resolve, reject) => {
      const handler = async dialog => {
        await dialog.accept()
        resolve(dialog.message())
      }
      page.on("dialog", handler)
    })

    const dialogPromise = dialogHandled
    await page.mouse.click(100, 100, { button: 'right' })
    const alertContent = await dialogPromise
    expect(alertContent).toMatch("You have not clicked with only main button.\nSecondary button pressed, usually the right button")
  })
})
