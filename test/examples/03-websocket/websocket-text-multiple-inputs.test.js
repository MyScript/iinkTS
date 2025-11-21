import { test, expect } from "@playwright/test"
import {
  callEditorIdle,
  writePointers,
  waitForExportedEvent,
  passModalKey
} from "../helper"
import centralProcessingUnit from "../__dataset__/centralProcessingUnit"
import oneThousandNineHundredAndFortyThree from "../__dataset__/1943"
import oneThousandNineHundredAndNintyThree from "../__dataset__/1993"

const switchToOtherQuestion = async (page, inputId) => {
  await page.locator(`#${ inputId }`).scrollIntoViewIfNeeded()
  await page.locator(`#${ inputId }`).click()
  await page.locator(`#${ inputId } #editorEl`).waitFor("attached")
  await callEditorIdle(page)
}

test.describe("Websocket Text Multiple Inputs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_multiple_inputs.html")
    await passModalKey(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Multiple inputs")
  })

  test("should resolve all questions", async ({ page }) => {
    const data0 = {
      inputId: "input-0",
      answerId: "answer-0",
      text: centralProcessingUnit,
    }

    await test.step("should answer the first question", async () => {
      for(const s of data0.text.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator(`#${ data0.answerId }`)).toHaveText(data0.text.exports["text/plain"])
    })

    const data1 = {
      inputId: "input-1",
      answerId: "answer-1",
      text: oneThousandNineHundredAndFortyThree,
    }

    await test.step("should answer the second question", async () => {
      await switchToOtherQuestion(page, data1.inputId)
      for(const s of data1.text.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator(`#${ data1.answerId }`)).toHaveText(data1.text.exports["text/plain"])
    })

    const data2 = {
      inputId: "input-2",
      answerId: "answer-2",
      text: oneThousandNineHundredAndFortyThree
    }

    await test.step("should answer the third question", async () => {
      await switchToOtherQuestion(page, data2.inputId)
      for(const s of data2.text.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator(`#${ data2.answerId }`)).toHaveText(data2.text.exports["text/plain"])
    })

    const data3 = {
      inputId: "input-3",
      answerId: "answer-3",
      text: oneThousandNineHundredAndNintyThree,
    }

    await test.step("should answer the fourth question", async () => {
      await switchToOtherQuestion(page, data3.inputId)
      for(const s of data3.text.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator(`#${ data3.answerId }`)).toHaveText(data3.text.exports["text/plain"])
    })

    await test.step("should validate answers", async () => {
      await expect(page.locator(`#${ data0.answerId }`)).not.toHaveClass("success")
      await expect(page.locator(`#${ data0.answerId }`)).not.toHaveClass("error")
      await expect(page.locator(`#${ data1.answerId }`)).not.toHaveClass("success")
      await expect(page.locator(`#${ data1.answerId }`)).not.toHaveClass("error")
      await expect(page.locator(`#${ data2.answerId }`)).not.toHaveClass("success")
      await expect(page.locator(`#${ data2.answerId }`)).not.toHaveClass("error")
      await expect(page.locator(`#${ data3.answerId }`)).not.toHaveClass("success")
      await expect(page.locator(`#${ data3.answerId }`)).not.toHaveClass("error")
      await page.click("#validate-answers")
      await expect(page.locator(`#${ data0.answerId }`)).toHaveClass(/success/)
      await expect(page.locator(`#${ data1.answerId }`)).toHaveClass(/success/)
      await expect(page.locator(`#${ data2.answerId }`)).toHaveClass(/error/)
      await expect(page.locator(`#${ data3.answerId }`)).toHaveClass(/success/)
    })

  })

})
