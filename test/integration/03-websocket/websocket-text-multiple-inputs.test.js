const { waitForEditorWebSocket, writePointers, waitEditorIdle } = require('../helper')
const { centralProcessingUnit, oneThousandNineHundredAndFortyThree, oneThousandNineHundredAndNintyThree } = require('../strokesDatas')

const switchToOtherQuestion = async (page, inputId) => {
  return Promise.all([
    page.locator(`#${inputId}`).click(),
    waitEditorIdle(page)
  ])
}

const getAnswerText = async (page, answerId) => {
  return (await page.locator(`#${answerId}`).textContent()).replace(/[\r\n]+/gm, " ").replace("  ", " ").toLocaleLowerCase()
}

describe('Websocket Text Multiple Inputs', () => {
  beforeAll(async () => {
    await page.goto('/examples/websocket/websocket_text_multiple_inputs.html')
    await waitForEditorWebSocket(page)
  })

  test('should have title', async () => {
    const title = await page.title()
    expect(title).toMatch('Multiple inputs')
  })

  const data0 = {
    inputId: "input-0",
    answerId: "answer-0",
    text: centralProcessingUnit,
  }

  test('should answer the first question', async () => {
    await writePointers(page, data0.text.strokes)
    await waitEditorIdle(page)
    const answerText = await getAnswerText(page, data0.answerId)
    expect(answerText).toEqual(data0.text.exports["text/plain"])
  })

  test('should validate the first answer', async () => {
    expect(await page.locator(`#${data0.answerId}`).getAttribute('class')).not.toContain('success')
    await page.click("#validate-answers")
    expect(await page.locator(`#${data0.answerId}`).getAttribute('class')).toContain('success')
  })

  const data1 = {
    inputId: "input-1",
    answerId: "answer-1",
    text: oneThousandNineHundredAndFortyThree,
  }

  test("should answer the second question", async () => {
    await switchToOtherQuestion(page, data1.inputId)
    await writePointers(page, data1.text.strokes)
    await waitEditorIdle(page)
    const answerText = await getAnswerText(page, data1.answerId)
    expect(answerText).toEqual(data1.text.exports["text/plain"])
  })

  test("should validate the second answer", async () => {
    expect(await page.locator(`#${data1.answerId}`).getAttribute('class')).not.toContain('success')
    expect(await page.locator(`#${data1.answerId}`).getAttribute('class')).toContain('error')
    await page.locator("#validate-answers").click()
    expect(await page.locator(`#${data1.answerId}`).getAttribute('class')).toContain('success')
    expect(await page.locator(`#${data1.answerId}`).getAttribute('class')).not.toContain('error')
  })

  const data2 = {
    inputId: "input-2",
    answerId: "answer-2",
    text: oneThousandNineHundredAndFortyThree
  }

  test("should answer the second question", async () => {
    await switchToOtherQuestion(page, data2.inputId)
    await writePointers(page, data2.text.strokes)
    await waitEditorIdle(page)
    const answerText = await getAnswerText(page, data2.answerId)
    expect(answerText).toEqual(data2.text.exports["text/plain"])
  })

  test("should validate the second answer", async () => {
    expect(await page.locator(`#${data2.answerId}`).getAttribute('class')).not.toContain('success')
    expect(await page.locator(`#${data2.answerId}`).getAttribute('class')).toContain('error')
    await page.locator("#validate-answers").click()
    expect(await page.locator(`#${data2.answerId}`).getAttribute('class')).not.toContain('success')
    expect(await page.locator(`#${data2.answerId}`).getAttribute('class')).toContain('error')
  })

  const data3 = {
    inputId: "input-3",
    answerId: "answer-3",
    text: oneThousandNineHundredAndNintyThree,
  }

  test("should answer the second question", async () => {
    await switchToOtherQuestion(page, data3.inputId)
    await writePointers(page, data3.text.strokes)
    await waitEditorIdle(page)
    const answerText = await getAnswerText(page, data3.answerId)
    expect(answerText).toEqual(data3.text.exports["text/plain"])
  })

  test("should validate the second answer", async () => {
    expect(await page.locator(`#${data3.answerId}`).getAttribute('class')).not.toContain('success')
    expect(await page.locator(`#${data3.answerId}`).getAttribute('class')).toContain('error')
    await page.locator("#validate-answers").click()
    expect(await page.locator(`#${data3.answerId}`).getAttribute('class')).toContain('success')
    expect(await page.locator(`#${data3.answerId}`).getAttribute('class')).not.toContain('error')
  })

})
