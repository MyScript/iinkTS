import { test, expect } from "@playwright/test"
import {
  writeStrokes,
  waitForEditorWebSocket,
  callEditorIdle,
  getEditorExportsType,
  waitForExportedEvent,
  writePointers
} from "../helper"
import buenosAires from "../__dataset__/buenosAires"
import rome from "../__dataset__/rome"
import madrid from "../__dataset__/madrid"
import tokyo from "../__dataset__/tokyo"
import paris from "../__dataset__/paris"
import TextNavActions from "../_partials/text-nav-actions"

test.describe("Websocket Text interact", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/websocket/websocket_text_interact.html")
    await waitForEditorWebSocket(page)
    await callEditorIdle(page)
  })

  test("should have title", async ({ page }) => {
    await expect(page).toHaveTitle("Interact with your app")
  })

  test("should resolve all questions", async ({ page }) => {

    await test.step(`should ask the capital of France`, async () => {
      await expect(page.locator("#question")).toHaveText("What is the capital of France?")
    })

    await test.step(`should answer question capital of France`, async () => {
      for(const s of paris.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator("#result")).toHaveText(new RegExp(paris.exports["text/plain"].at(-1)))
      await expect(page.locator("#result")).toHaveCSS("color", "rgb(0, 128, 0)")
    })

    await test.step(`should go second question`, async () => {
      await page.locator("#next-btn").click()
      await expect(page.locator("#question")).toHaveText("What is the capital of Italy?")
    })

    await test.step(`should answer question capital of Italy`, async () => {
      await Promise.all([
        waitForExportedEvent(page),
        writeStrokes(page, rome.strokes)
      ])
      await expect(page.locator("#result")).toHaveText(new RegExp(rome.exports["text/plain"].at(-1)))
      await expect(page.locator("#result")).toHaveCSS("color", "rgb(0, 128, 0)")
    })

    await test.step(`should go third question`, async () => {
      await page.locator("#next-btn").click()
      await expect(page.locator("#question")).toHaveText("What is the capital of Spain?")
    })

    await test.step(`should answer question capital of Spain`, async () => {
      for(const s of madrid.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator("#result")).toHaveText(new RegExp(madrid.exports["text/plain"].at(-1)))
      await expect(page.locator("#result")).toHaveCSS("color", "rgb(0, 128, 0)")
    })

    await test.step(`should go fourth question`, async () => {
      await page.locator("#next-btn").click()
      await expect(page.locator("#question")).toHaveText("What is the capital of Argentina?")
    })

    await test.step(`should answer question capital of Argentina`, async () => {
      for(const s of buenosAires.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator("#result")).toHaveText(new RegExp(buenosAires.exports["text/plain"].at(-1)))
      await expect(page.locator("#result")).toHaveCSS("color", "rgb(0, 128, 0)")
    })

    await test.step(`should go fifth question`, async () => {
      await page.locator("#next-btn").click()
      await expect(page.locator("#question")).toHaveText("What is the capital of Japan?")
    })

    await test.step(`should answer question capital of Japan`, async () => {
      for(const s of tokyo.strokes) {
        await Promise.all([
          waitForExportedEvent(page),
          writePointers(page, s.pointers)
        ])
      }
      await expect(page.locator("#result")).toHaveText(new RegExp(tokyo.exports["text/plain"].at(-1)))
      await expect(page.locator("#result")).toHaveCSS("color", "rgb(0, 128, 0)")
    })
  })

  TextNavActions.test({ skipClear: true, resultLocator: ".prompter-container" })
})
