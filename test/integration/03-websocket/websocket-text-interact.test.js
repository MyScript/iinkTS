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
  buenosAires
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


  test(`should answer questions`, async () => {
    await waitForEditorWebSocket(page)
    let [exportParis] = await Promise.all([
      getExportedDatas(page),
      write(page, paris.strokes)
    ])

    const jiixParisExpected = paris.exports["application/vnd.myscript.jiix"]
    const jiixParisReceived = exportParis["application/vnd.myscript.jiix"]

    expect(jiixParisReceived.label).toStrictEqual(jiixParisExpected.label)

    await page.locator("#nextButton").click()
    //wait for the question to change
    await page.waitForTimeout(400)

    let [exportRome] = await Promise.all([
      getExportedDatas(page),
      write(page, rome.strokes)
    ])

    const jiixRomeExpected = rome.exports["application/vnd.myscript.jiix"]
    const jiixRomeReceived = exportRome["application/vnd.myscript.jiix"]

    expect(jiixRomeReceived.label).toStrictEqual(jiixRomeExpected.label)

    await page.locator("#nextButton").click()
    //wait for the question to change
    await page.waitForTimeout(400)

    let [exportMadrid] = await Promise.all([
      getExportedDatas(page),
      write(page, madrid.strokes)
    ])

    const jiixMadridExpected = madrid.exports["application/vnd.myscript.jiix"]
    const jiixMadridReceived = exportMadrid["application/vnd.myscript.jiix"]

    expect(jiixMadridReceived.label).toStrictEqual(jiixMadridExpected.label)

    await page.locator("#nextButton").click()
    //wait for the question to change
    await page.waitForTimeout(400)
    await write(page, buenos.strokes)

    await page.waitForTimeout(400)

    let [exportBuenosAires] = await Promise.all([
      getExportedDatas(page),
      write(page, aires.strokes)
    ])
    //wait for the export to be loaded
    await page.waitForTimeout(400)
    const jiixBuenosAiresExpected = buenosAires.exports["application/vnd.myscript.jiix"].label
    const jiixBuenosAiresReceived = exportBuenosAires["application/vnd.myscript.jiix"].label

    expect(jiixBuenosAiresReceived).toStrictEqual(jiixBuenosAiresExpected)

    await page.locator("#nextButton").click()
    //wait for the question to change
    await page.waitForTimeout(400)

    let [exportTokyo] = await Promise.all([
      getExportedDatas(page),
      write(page, tokyo.strokes)
    ])

    const jiixTokyoExpected = tokyo.exports["application/vnd.myscript.jiix"]
    const jiixTokyoReceived = exportTokyo["application/vnd.myscript.jiix"]

    expect(jiixTokyoReceived.label).toStrictEqual(jiixTokyoExpected.label)
  })
})
