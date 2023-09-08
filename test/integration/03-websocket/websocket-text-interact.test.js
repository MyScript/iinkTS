const { write, getExportedDatas, waitForEditorWebSocket, waitEditorIdle } = require("../helper")
const { paris, tokyo, madrid, rome, buenosAires } = require("../strokesDatas")


describe("Websocket Text interact", () => {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_text_interact.html")
    await waitForEditorWebSocket(page)
    await waitEditorIdle(page)
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Interact with your app")
  })

  test(`should ask teh capital of France`, async () => {
    const question = await page.locator("#question").textContent()
    expect(question).toEqual("What is the capital of France?")
  })

  test(`should answer question capital of France`, async () => {
    const [exportParis] = await Promise.all([
      getExportedDatas(page),
      write(page, paris.strokes, -100)
    ])
    await waitEditorIdle(page)
    let textExpected = paris.exports["application/vnd.myscript.jiix"].label
    let textReceived = exportParis["text/plain"]
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#nextButton").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Italy")
  })

  test(`should answer question capital of Italy`, async () => {
    const [exportRomes] = await Promise.all([
      getExportedDatas(page),
      write(page, rome.strokes, -100)
    ])
    await waitEditorIdle(page)
    textExpected = rome.exports["application/vnd.myscript.jiix"].label
    textReceived = exportRomes["text/plain"]
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#nextButton").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Spain")
  })

  test(`should answer question capital of Spain`, async () => {
    const [exportMadrid] = await Promise.all([
      getExportedDatas(page),
      write(page, madrid.strokes, -100)
    ])
    await waitEditorIdle(page)
    textExpected = madrid.exports["application/vnd.myscript.jiix"].label
    textReceived = exportMadrid["text/plain"]
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#nextButton").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Argentina")
  })

  test(`should answer question capital of Argentina`, async () => {
    let exportBuenosAires
    for (let s of buenosAires.strokes) {
      [exportBuenosAires] = await Promise.all([
        getExportedDatas(page),
        write(page, [s], -100, -200)
      ])
    }
    await waitEditorIdle(page)
    textExpected = buenosAires.exports["application/vnd.myscript.jiix"].label
    textReceived = exportBuenosAires["text/plain"]
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#nextButton").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Japan")
  })

  test(`should answer question capital of Japan`, async () => {
    const [exportTokyo] = await Promise.all([
      getExportedDatas(page),
      write(page, tokyo.strokes)
    ])
    await waitEditorIdle(page)
    textExpected = tokyo.exports["application/vnd.myscript.jiix"].label
    textReceived = exportTokyo["text/plain"]
    expect(textReceived).toStrictEqual(textExpected)
  })
})
