const { writePointers, getDatasFromExportedEvent, getEditorModelExportsType } = require("../../helper")
const { sumSimple } = require("../../strokesDatas")

describe('Nav actions math clear', () => {
    test("should clear", async () => {
        await Promise.all([getDatasFromExportedEvent(page), writePointers(page, sumSimple.strokes)])
        let resultElement = page.locator("#result")
        resultText = await resultElement.textContent()
        expect(resultText).toBeDefined()

        const [clearExport] = await Promise.all([getDatasFromExportedEvent(page), page.click("#clear")])
        const emptyLatex = ""
        const LatexReceived = clearExport["application/x-latex"]
        expect(LatexReceived).toEqual(emptyLatex)

        resultElement = page.locator("#result")
        resultText = await resultElement.textContent()
        expect(resultText).toBe("")
    })
})
