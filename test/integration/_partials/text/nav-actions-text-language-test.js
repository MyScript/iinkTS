const { getDatasFromExportedEvent, write, waitEditorIdle } = require("../../helper")
const { h } = require("../../strokesDatas")

describe('Nav actions text language', () => {
  test('should change language', async () => {
    await Promise.all([
      getDatasFromExportedEvent(page),
      write(page, h.strokes),
    ])

    await waitEditorIdle(page)

    let resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toStrictEqual(h.exports['text/plain'].at(-1))

    await Promise.all([
      getDatasFromExportedEvent(page),
      page.selectOption('#language', 'fr_FR'),
    ])

    await waitEditorIdle(page)

    resultElement = page.locator('#result')
    resultText = await resultElement.textContent()
    expect(resultText).toBe('')
  })
})