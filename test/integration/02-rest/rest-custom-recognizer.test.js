const { assert } = require("console")
const {
  waitForEditorRest,
  write
} = require('../helper')
const { hello } = require('../strokesDatas')

describe('Rest Text', () => {

  beforeAll(async () => {
    await page.goto('/examples/dev/rest_custom_recognizer.html')
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: 'load' })
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('REST custom recognizer')
  })

  test("should have info in recognizer-info div", async () => {
    const recognizerInfo = await page.$eval(".recognizer-info", el => el.textContent) 
    assert(recognizerInfo.includes("Server url: http://"))
    assert(recognizerInfo.includes("Message sent:"))
    assert(recognizerInfo.includes("Message received:"))
  })

  test("should have info in recognizer-info div", async () => {
    await write(page, hello.strokes)
    const recognizerInfo = await page.$eval(".recognizer-info", el => el.textContent) 
    assert(recognizerInfo.includes("connection established at ws://"))
    assert(recognizerInfo.includes("POST: {\"configuration\":{\"lang\":\"en_US\""))
    assert(recognizerInfo.includes("Response: {\"type\":\"Text\",\"label\":\"hello\""))
  })
})
