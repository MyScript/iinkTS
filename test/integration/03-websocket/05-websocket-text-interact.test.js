const { write, getExportedDatas, waitForEditorWebSocket } = require("../helper")
const {
  h,
  hello,
  buenos,
  aires,
  paris,
  tokyo,
  madrid,
  rome,
} = require("../strokesDatas")

describe("Websocket Text", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_interact.html")
  })

  beforeEach(async () => {
    await page.reload({ waitUntil: "networkidle" })
    await waitForEditorWebSocket(page)
    await page.waitForTimeout(1000)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Interact with your app")
  })

  for (let i = 0; i < 5; i++) {
    i++
    test(`should answer the question ${i}`, async () => {
      const questionElement = page.locator("#question")
      const question = await questionElement.textContent()
      let stroke
      if (question.includes("France")) {
        stroke = paris
      } else if (question.includes("Japan")) {
        stroke = tokyo
      } else if (question.includes("Spain")) {
        stroke = madrid
      } else if (question.includes("Italy")) {
        stroke = rome
      } else if (question.includes("Argentina")) {
        stroke = buenos
      }

      if (question.includes("Argentina")) {
        await Promise.all([write(page, buenos.strokes)])
        await Promise.all([write(page, aires.strokes)])
      } else {
        await Promise.all([write(page, stroke.strokes)])
      }

      let [exports] = await Promise.all([getExportedDatas(page)])

      const jiixExpected = stroke.exports["application/vnd.myscript.jiix"]
      const jiixReceived = exports["application/vnd.myscript.jiix"]

      if (question.includes("Argentina")) {
        expect(jiixReceived.label).toStrictEqual(
          `${jiixReceived.label} ${aires.exports["application/vnd.myscript.jiix"].label}`
        )
      } else {
        expect(jiixReceived.label).toStrictEqual(jiixExpected.label)
      }
    })
  }
})
