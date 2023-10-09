const { haveSameLabels, write, getExportsFromEditorModel, getDatasFromImportedEvent, getDatasFromExportedEvent, waitEditorLoaded, waitEditorIdle } = require("../helper")

const mathContentList = [
  {
    id: "eq-1",
    latex: "a^{2}+b^{2}=c^{2}",
    textContent: "a2+b2=c2",
    strokesToWrite: [{ "pointerType": "mouse", "pointerId": 0, "x": [159, 157, 156, 154, 150, 149, 146, 143, 142, 138, 144, 149, 154, 159, 162, 166, 169, 168, 169, 169, 169, 168, 168, 168, 168], "y": [174, 177, 180, 183, 188, 191, 195, 199, 202, 205, 204, 204, 204, 204, 204, 202, 202, 205, 208, 212, 216, 219, 222, 225, 229], "t": [1689858551959, 1689858552062, 1689858552078, 1689858552094, 1689858552112, 1689858552128, 1689858552162, 1689858552194, 1689858552228, 1689858552261, 1689858552711, 1689858552727, 1689858552744, 1689858552761, 1689858552835, 1689858552877, 1689858552910, 1689858553177, 1689858553193, 1689858553227, 1689858553243, 1689858553260, 1689858553277, 1689858553431, 1689858553460], "p": [0.5, 0.81, 0.68, 0.7, 0.77, 0.68, 0.74, 0.74, 0.68, 0.74, 0.77, 0.74, 0.74, 0.74, 0.68, 0.73, 0.68, 0.68, 0.68, 0.71, 0.71, 0.68, 0.68, 0.68, 0.71] }],
    latexAfterWriting: "4a^{2}+b^{2}=c^{2}"
  },
  {
    id: "eq-2",
    latex: "c=\\sqrt{a^{2}+b^{2}}",
    textContent: "c=a2+b2​",
    strokesToWrite: [{ "pointerType": "mouse", "pointerId": 0, "x": [190, 190, 191, 192, 193, 195, 198, 201, 206, 211, 215, 218, 222, 224, 226, 227, 227, 227, 226, 225, 225, 222, 221, 218, 214, 210, 208, 205, 201, 198, 206, 215, 228, 238, 247, 255], "y": [194, 191, 188, 183, 180, 176, 174, 172, 171, 171, 172, 173, 175, 178, 181, 184, 187, 192, 195, 198, 201, 206, 209, 213, 217, 220, 224, 227, 230, 233, 232, 231, 231, 231, 231, 231], "t": [1689859052854, 1689859052908, 1689859052922, 1689859052956, 1689859052972, 1689859052989, 1689859053054, 1689859053092, 1689859053122, 1689859053139, 1689859053155, 1689859053189, 1689859053222, 1689859053238, 1689859053272, 1689859053289, 1689859053306, 1689859053339, 1689859053356, 1689859053372, 1689859053389, 1689859053421, 1689859053438, 1689859053472, 1689859053489, 1689859053522, 1689859053555, 1689859053589, 1689859053621, 1689859053739, 1689859053922, 1689859053938, 1689859053955, 1689859053971, 1689859053988, 1689859054005], "p": [0.5, 0.83, 0.68, 0.75, 0.68, 0.73, 0.7, 0.7, 0.75, 0.74, 0.72, 0.68, 0.73, 0.7, 0.7, 0.68, 0.68, 0.74, 0.68, 0.68, 0.68, 0.76, 0.68, 0.74, 0.76, 0.74, 0.73, 0.72, 0.74, 0.72, 0.8, 0.81, 0.64, 0.68, 0.81, 0.8] }],
    latexAfterWriting: "2c=\\sqrt{a^{2}+b^{2}}"
  },
  {
    id: "eq-3",
    latex: "a=\\sqrt{c^{2}-b^{2}}",
    textContent: "a=c2−b2​",
    strokesToWrite: [{"pointerType":"mouse","pointerId":0,"x":[406,411,415,421,432,456,489,530,579,608,624,631,634,637,645,657,668,674,679,684,688,691,694,700,704],"y":[248,246,246,245,245,244,240,240,240,242,240,240,240,240,240,239,238,237,237,237,238,238,236,235,235],"t":[1689870299381,1689870299471,1689870299487,1689870299504,1689870299521,1689870299537,1689870299554,1689870299571,1689870299587,1689870299603,1689870299620,1689870299637,1689870299670,1689870299687,1689870299703,1689870299720,1689870299736,1689870299753,1689870299771,1689870299786,1689870299804,1689870300048,1689870300070,1689870300086,1689870300103],"p":[0.5,0.77,0.71,0.77,0.67,0.51,0.42,0.36,0.3,0.46,0.6,0.78,0.68,0.68,0.8,0.65,0.67,0.77,0.74,0.74,0.72,0.68,0.7,0.77,0.71]},{"pointerType":"mouse","pointerId":0,"x":[537,540,546,551,558,561,561,561,561,560,555,549,548,555,559,565,568,571,575,580,583],"y":[276,271,269,266,264,266,270,278,288,300,309,318,321,317,316,315,314,314,313,312,311],"t":[1689870300721,1689870300819,1689870300836,1689870300852,1689870300869,1689870300969,1689870300986,1689870301002,1689870301018,1689870301035,1689870301053,1689870301069,1689870301102,1689870301252,1689870301269,1689870301286,1689870301302,1689870301335,1689870301402,1689870301419,1689870301436],"p":[0.5,0.76,0.77,0.76,0.79,0.7,0.71,0.8,0.68,0.65,0.68,0.67,0.68,0.8,0.72,0.77,0.68,0.68,0.72,0.75,0.68]}],
    latexAfterWriting: "a=\\dfrac{\\sqrt{c^{2}-b^{2}}}{2}"
  },
  {
    id: "eq-4",
    latex: "b=\\sqrt{c^{2}-a^{2}}",
    textContent: "b=c2−a2​",
    strokesToWrite: [{ "pointerType": "mouse", "pointerId": 0, "x": [403, 400, 396, 392, 389, 387, 385, 383, 383, 381, 379, 378, 376, 375, 374, 374, 374, 374, 375, 375, 374, 374, 374, 375, 376, 377, 379, 385, 389, 392, 396, 398, 399, 399, 399, 398, 396, 393, 388, 385, 382, 379, 376], "y": [127, 129, 132, 135, 139, 142, 145, 149, 154, 159, 163, 167, 173, 177, 180, 183, 186, 189, 192, 197, 204, 214, 221, 224, 227, 230, 233, 237, 238, 238, 231, 225, 220, 216, 213, 210, 206, 204, 204, 204, 204, 204, 207], "t": [1689860222378, 1689860222480, 1689860222497, 1689860222531, 1689860222563, 1689860222580, 1689860222597, 1689860222630, 1689860222664, 1689860222681, 1689860222697, 1689860222713, 1689860222747, 1689860222764, 1689860222781, 1689860222797, 1689860222813, 1689860222830, 1689860222847, 1689860222864, 1689860222880, 1689860222897, 1689860222914, 1689860222930, 1689860222947, 1689860222963, 1689860222980, 1689860222997, 1689860223013, 1689860223030, 1689860223130, 1689860223146, 1689860223163, 1689860223180, 1689860223197, 1689860223213, 1689860223230, 1689860223263, 1689860223297, 1689860223313, 1689860223330, 1689860223364, 1689860223446], "p": [0.5, 0.81, 0.74, 0.74, 0.74, 0.7, 0.7, 0.73, 0.74, 0.75, 0.73, 0.72, 0.77, 0.72, 0.68, 0.68, 0.68, 0.68, 0.68, 0.74, 0.79, 0.68, 0.78, 0.68, 0.68, 0.68, 0.7, 0.79, 0.72, 0.68, 0.8, 0.77, 0.75, 0.71, 0.68, 0.68, 0.73, 0.7, 0.74, 0.68, 0.68, 0.68, 0.72] }],
    latexAfterWriting: "b=6\\sqrt{c^{2}-a^{2}}"
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

      beforeAll(async () => {
        await page.reload({ waitUntil: 'load' })
        await waitEditorLoaded(page)
        await waitEditorIdle(page)
      })

      test(`should open modal editor`, async () => {
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
        currentExport = await getExportsFromEditorModel(page)
        const jiixExpected = JSON.parse(await page.locator(`#${ mc.id }`).getAttribute("data-jiix"))
        expect(haveSameLabels(currentExport["application/vnd.myscript.jiix"], jiixExpected)).toEqual(true)
        expect(currentExport["application/x-latex"]).toEqual(mc.latex)
      })

      test(`should update equation`, async () => {
        await Promise.all([
          getDatasFromExportedEvent(page),
          write(page, mc.strokesToWrite)
        ])
        await waitEditorIdle(page)
        currentExport = await getExportsFromEditorModel(page)
        expect(currentExport['application/x-latex']).toEqual(mc.latexAfterWriting)
      })

      test(`should close modal editor`, async () => {
        await page.locator("#close").click()
        expect(await page.locator("#editor-modal").isVisible()).toEqual(false)
      })

      test(`should update math content`, async () => {
        expect(await page.locator(`#${mc.id} .katex-html`).textContent()).not.toEqual(currentTextContent)
      })

      test(`should re-open modal editor with new equation`, async () => {
        await Promise.all([
          getDatasFromImportedEvent(page),
          page.locator(`#${ mc.id }`).click()
        ])
        await waitEditorIdle(page)
        expect(await page.locator("#editor-modal").isVisible()).toEqual(true)
        currentExport = await getExportsFromEditorModel(page)
        expect(currentExport['application/x-latex']).toEqual(mc.latexAfterWriting)
      })
    })
  })

})
