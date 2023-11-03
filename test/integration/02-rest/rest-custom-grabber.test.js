const { assert } = require("console")
const {
  waitForEditorRest,
  getDatasFromExportedEvent,
  write
} = require('../helper')
const { hello } = require('../strokesDatas')

describe('Rest Text', () => {

  beforeAll(async () => {
    await page.goto('/examples/dev/rest_custom_grabber.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Rest custom grabber')
  })

  test("should have info in point-info div", async () => {
    const pointInfo = await page.$eval(".point-info", el => el.textContent) 
    assert(pointInfo.includes("Down at:"))
    assert(pointInfo.includes("Move to:"))
    assert(pointInfo.includes("Up at:"))
  })

  test("should have info in recognizer-info div", async () => {
    await Promise.all([getDatasFromExportedEvent(page), write(page, hello.strokes)])
    const result = await page.$eval("#result", el => el.textContent)
    assert(result.match("hello"))

    const pointerDown = await page.$eval("#pointer-down", el => el.textContent) 
    assert(pointerDown.includes("Down at: {\"x\":489,\"y\":238,\"t\":"))

    const pointerMove = await page.$eval("#pointer-move", el => el.textContent) 
    assert(pointerMove.includes("Move to: {\"x\":504,\"y\":236,\"t\":"))
    
    const pointerUp = await page.$eval("#pointer-up", el => el.textContent) 
    assert(pointerUp.includes("Up at: {\"x\":504,\"y\":236,\"t\":"))  
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