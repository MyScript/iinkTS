const { writePointers, getExportedDatas, waitForEditorWebSocket, waitEditorIdle, getEditorModelExportsType } = require("../helper")
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
    await writePointers(page, paris.strokes)
    await waitEditorIdle(page)
    const textExpected = paris.exports["text/plain"].at(-1)
    const textReceived = await getEditorModelExportsType(page, "text/plain")
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#next-btn").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Italy")
  })

  test(`should answer question capital of Italy`, async () => {
    await writePointers(page, rome.strokes)
    await waitEditorIdle(page)
    const textExpected = rome.exports["text/plain"].at(-1)
    const textReceived = await getEditorModelExportsType(page, "text/plain")
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#next-btn").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Spain")
  })

  test(`should answer question capital of Spain`, async () => {
    await writePointers(page, madrid.strokes)
    await waitEditorIdle(page)
    const textExpected = madrid.exports["text/plain"].at(-1)
    const textReceived = await getEditorModelExportsType(page, "text/plain")
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#next-btn").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Argentina")
  })

  test(`should answer question capital of Argentina`, async () => {
    await writePointers(page, buenosAires.strokes)
    await waitEditorIdle(page)
    const textExpected = buenosAires.exports["text/plain"].at(-1)
    const textReceived = await getEditorModelExportsType(page, "text/plain")
    expect(textReceived).toStrictEqual(textExpected)
  })

  test(`should go next question`, async () => {
    await page.locator("#next-btn").click()
    await waitEditorIdle(page)
    const question = await page.locator("#question").textContent()
    expect(question).toContain("Japan")
  })

  test(`should answer question capital of Japan`, async () => {
    await writePointers(page, tokyo.strokes)
    await waitEditorIdle(page)
    const textExpected = tokyo.exports["text/plain"].at(-1)
    const textReceived = await getEditorModelExportsType(page, "text/plain")
    expect(textReceived).toStrictEqual(textExpected)
  })
})
