const { haveSameLabels, write, getExportsFromEditorModel, getDatasFromImportedEvent, getDatasFromExportedEvent, waitEditorIdle } = require("../helper")

const mathContentList = [
  {
    id: "eq-1",
    latex: "a^{2}+b^{2}=c^{2}",
    textContent: "a2+b2=c2",
    strokesToWrite: [{ "pointerType": "mouse", "x": [159, 157, 156, 154, 150, 149, 146, 143, 142, 138, 144, 149, 154, 159, 162, 166, 169, 168, 169, 169, 169, 168, 168, 168, 168], "y": [174, 177, 180, 183, 188, 191, 195, 199, 202, 205, 204, 204, 204, 204, 204, 202, 202, 205, 208, 212, 216, 219, 222, 225, 229], "t": [1689858551959, 1689858552062, 1689858552078, 1689858552094, 1689858552112, 1689858552128, 1689858552162, 1689858552194, 1689858552228, 1689858552261, 1689858552711, 1689858552727, 1689858552744, 1689858552761, 1689858552835, 1689858552877, 1689858552910, 1689858553177, 1689858553193, 1689858553227, 1689858553243, 1689858553260, 1689858553277, 1689858553431, 1689858553460], "p": [0.5, 0.81, 0.68, 0.7, 0.77, 0.68, 0.74, 0.74, 0.68, 0.74, 0.77, 0.74, 0.74, 0.74, 0.68, 0.73, 0.68, 0.68, 0.68, 0.71, 0.71, 0.68, 0.68, 0.68, 0.71] }],
    latexAfterWriting: "4a^{2}+b^{2}=c^{2}"
  },
  {
    id: "eq-2",
    latex: "c=\\sqrt{a^{2}+b^{2}}",
    textContent: "c=a2+b2​",
    strokesToWrite: [{ "pointerType": "mouse", "x": [190, 190, 191, 192, 193, 195, 198, 201, 206, 211, 215, 218, 222, 224, 226, 227, 227, 227, 226, 225, 225, 222, 221, 218, 214, 210, 208, 205, 201, 198, 206, 215, 228, 238, 247, 255], "y": [194, 191, 188, 183, 180, 176, 174, 172, 171, 171, 172, 173, 175, 178, 181, 184, 187, 192, 195, 198, 201, 206, 209, 213, 217, 220, 224, 227, 230, 233, 232, 231, 231, 231, 231, 231], "t": [1689859052854, 1689859052908, 1689859052922, 1689859052956, 1689859052972, 1689859052989, 1689859053054, 1689859053092, 1689859053122, 1689859053139, 1689859053155, 1689859053189, 1689859053222, 1689859053238, 1689859053272, 1689859053289, 1689859053306, 1689859053339, 1689859053356, 1689859053372, 1689859053389, 1689859053421, 1689859053438, 1689859053472, 1689859053489, 1689859053522, 1689859053555, 1689859053589, 1689859053621, 1689859053739, 1689859053922, 1689859053938, 1689859053955, 1689859053971, 1689859053988, 1689859054005], "p": [0.5, 0.83, 0.68, 0.75, 0.68, 0.73, 0.7, 0.7, 0.75, 0.74, 0.72, 0.68, 0.73, 0.7, 0.7, 0.68, 0.68, 0.74, 0.68, 0.68, 0.68, 0.76, 0.68, 0.74, 0.76, 0.74, 0.73, 0.72, 0.74, 0.72, 0.8, 0.81, 0.64, 0.68, 0.81, 0.8] }],
    latexAfterWriting: "2c=\\sqrt{a^{2}+b^{2}}"
  },
  {
    id: "eq-3",
    latex: "a=\\sqrt{c^{2}-b^{2}}",
    textContent: "a=c2−b2​",
    strokesToWrite: [{ "pointerType": "mouse", "x": [159, 157, 156, 154, 150, 149, 146, 143, 142, 138, 144, 149, 154, 159, 162, 166, 169, 168, 169, 169, 169, 168, 168, 168, 168], "y": [174, 177, 180, 183, 188, 191, 195, 199, 202, 205, 204, 204, 204, 204, 204, 202, 202, 205, 208, 212, 216, 219, 222, 225, 229], "t": [1689858551959, 1689858552062, 1689858552078, 1689858552094, 1689858552112, 1689858552128, 1689858552162, 1689858552194, 1689858552228, 1689858552261, 1689858552711, 1689858552727, 1689858552744, 1689858552761, 1689858552835, 1689858552877, 1689858552910, 1689858553177, 1689858553193, 1689858553227, 1689858553243, 1689858553260, 1689858553277, 1689858553431, 1689858553460], "p": [0.5, 0.81, 0.68, 0.7, 0.77, 0.68, 0.74, 0.74, 0.68, 0.74, 0.77, 0.74, 0.74, 0.74, 0.68, 0.73, 0.68, 0.68, 0.68, 0.71, 0.71, 0.68, 0.68, 0.68, 0.71] }],
    latexAfterWriting: "4a=\\sqrt{c^{2}-b^{2}}"
  },
  {
    id: "eq-4",
    latex: "b=\\sqrt{c^{2}-a^{2}}",
    textContent: "b=c2−a2​",
    strokesToWrite: [{ "pointerType": "mouse", "x": [190, 190, 191, 192, 193, 195, 198, 201, 206, 211, 215, 218, 222, 224, 226, 227, 227, 227, 226, 225, 225, 222, 221, 218, 214, 210, 208, 205, 201, 198, 206, 215, 228, 238, 247, 255], "y": [194, 191, 188, 183, 180, 176, 174, 172, 171, 171, 172, 173, 175, 178, 181, 184, 187, 192, 195, 198, 201, 206, 209, 213, 217, 220, 224, 227, 230, 233, 232, 231, 231, 231, 231, 231], "t": [1689859052854, 1689859052908, 1689859052922, 1689859052956, 1689859052972, 1689859052989, 1689859053054, 1689859053092, 1689859053122, 1689859053139, 1689859053155, 1689859053189, 1689859053222, 1689859053238, 1689859053272, 1689859053289, 1689859053306, 1689859053339, 1689859053356, 1689859053372, 1689859053389, 1689859053421, 1689859053438, 1689859053472, 1689859053489, 1689859053522, 1689859053555, 1689859053589, 1689859053621, 1689859053739, 1689859053922, 1689859053938, 1689859053955, 1689859053971, 1689859053988, 1689859054005], "p": [0.5, 0.83, 0.68, 0.75, 0.68, 0.73, 0.7, 0.7, 0.75, 0.74, 0.72, 0.68, 0.73, 0.7, 0.7, 0.68, 0.68, 0.74, 0.68, 0.68, 0.68, 0.76, 0.68, 0.74, 0.76, 0.74, 0.73, 0.72, 0.74, 0.72, 0.8, 0.81, 0.64, 0.68, 0.81, 0.8] }],
    latexAfterWriting: "2b=\\sqrt{c^{2}-a^{2}}"
  },
]

describe("Websocket Math Inside Page", function () {
  beforeAll(async () => {
    await page.goto("/examples/websocket/websocket_math_inside_page.html")
  })

  test("should have title", async () => {
    const title = await page.title()
    expect(title).toMatch("Dynamic math part inside a page")
  })

  mathContentList.forEach(async (mc) => {
    describe(`Math content for ${mc.id}`, () => {
      let currentExport
      let currentTextContent

      test(`should open modal editor`, async () => {
        await waitEditorIdle(page)
        expect(await page.locator("#editor-modal").isVisible()).toEqual(false)
        currentTextContent = await page.locator(`#${mc.id} .katex-html`).textContent()
        expect(currentTextContent).toEqual(mc.textContent)
        await Promise.all([
          getDatasFromImportedEvent(page),
          page.locator(`#${ mc.id }`).click()
        ])
        await waitEditorIdle(page)
        expect(await page.locator("#editor-modal").isVisible()).toEqual(true)
      })

      test(`should import data-jiix`, async () => {
        await waitEditorIdle(page)
        currentExport = await getExportsFromEditorModel(page)
        const jiixExpected = JSON.parse(await page.locator(`#${ mc.id }`).getAttribute("data-jiix"))
        expect(haveSameLabels(currentExport["application/vnd.myscript.jiix"], jiixExpected)).toEqual(true)
        expect(currentExport["application/x-latex"]).toEqual(mc.latex)
      })

      test(`should update equation`, async () => {
        await waitEditorIdle(page)
        await Promise.all([
          getDatasFromExportedEvent(page),
          write(page, mc.strokesToWrite)
        ])
        await waitEditorIdle(page)
        currentExport = await getExportsFromEditorModel(page)
        expect(currentExport['application/x-latex']).toEqual(mc.latexAfterWriting)
      })

      test(`should close modal editor`, async () => {
        await waitEditorIdle(page)
        await page.locator("#close").click()
        expect(await page.locator("#editor-modal").isVisible()).toEqual(false)
      })

      test(`should update math content`, async () => {
        await waitEditorIdle(page)
        expect(await page.locator(`#${mc.id} .katex-html`).textContent()).not.toEqual(currentTextContent)
      })

      test(`should re-open modal editor with new equation`, async () => {
        await waitEditorIdle(page)
        await Promise.all([
          getDatasFromImportedEvent(page),
          page.locator(`#${ mc.id }`).click()
        ])
        await waitEditorIdle(page)
        expect(await page.locator("#editor-modal").isVisible()).toEqual(true)
        currentExport = await getExportsFromEditorModel(page)
        expect(currentExport['application/x-latex']).toEqual(mc.latexAfterWriting)
      })

      test(`should close modal editor`, async () => {
        await waitEditorIdle(page)
        await page.locator("#close").click()
        expect(await page.locator("#editor-modal").isVisible()).toEqual(false)
      })
    })
  })

})
