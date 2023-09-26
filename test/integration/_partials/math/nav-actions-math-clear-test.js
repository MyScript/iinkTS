const { writePointers, getDatasFromExportedEvent } = require("../../helper")
const { sumSimple } = require("../../strokesDatas")

describe('Nav actions math clear', () => {
    test("should clear", async () => {
        await Promise.all([
            getDatasFromExportedEvent(page),
            writePointers(page, sumSimple.strokes)
        ])

        let resultText = await page.locator("#result").textContent()
        expect(resultText).toBeDefined()

        const [clearExport] = await Promise.all([
            getDatasFromExportedEvent(page),
            page.click("#clear")
        ])

        const emptyLatex = ""
        const LatexReceived = clearExport["application/x-latex"]
        expect(LatexReceived).toEqual(emptyLatex)

        resultText = await page.locator("#result").textContent()
        expect(resultText).toBe("")
    })
})
