const {
  waitForEditorRest,
  write,
  getDatasFromExportedEvent
} = require('../helper')
const { h } = require('../strokesDatas')

describe('Rest Text', () => {

  beforeAll(async () => {
    await page.goto('/examples/dev/rest_custom_recognizer.html')
    await waitForEditorRest(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('REST custom recognizer')
  })

  test("should have info in recognizer-info div", async () => {
    const url = await page.$eval("#recognizer-url", el => el.textContent)
    expect(url).toContain("Server url: http://")
    const sent = await page.$eval("#recognizer-sent", el => el.textContent)
    expect(sent).toContain("Message sent:")
    const received = await page.$eval("#recognizer-received", el => el.textContent)
    expect(received).toContain("Message received:")
  })

  test("should have info in recognizer-info div", async () => {
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, h.strokes)
    ])
    const url = await page.$eval("#recognizer-url", el => el.textContent)
    expect(url).toContain("Server url: ")
    expect(url).toContain("/api/v4.0/iink/batch")
    const sent = await page.$eval("#recognizer-sent", el => el.textContent)
    expect(sent).toContain("POST: {\"configuration\":{\"lang\":\"en_US\"")
    const received = await page.$eval("#recognizer-received", el => el.textContent)
    expect(received).toContain("Response: {\"type\":\"Text\",\"label\":\"h\"")
  })
})
