import { test, expect } from "@playwright/test"
import { passModalKey } from "../helper"
import playbackDemo from "../__dataset__/playbackDemo"

test.describe("Interactive ink canvas Stroke Playback", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_stroke_playback.html`)
    await passModalKey(page)
  })

  test("should start idle with Play enabled and Pause/Stop disabled", async ({ page }) => {
    await expect(page.locator("#play")).toBeEnabled()
    await expect(page.locator("#pauseResume")).toBeDisabled()
    await expect(page.locator("#stop")).toBeDisabled()
    await expect(page.locator("#pauseResume")).toHaveText("Pause")
    await expect(page.locator("#progressLabel")).toHaveText(/^0 \/ \d+ strokes$/)
  })

  test("should toggle the strokes canvas visibility", async ({ page }) => {
    const canvas = page.locator("#strokesToPlay")
    const toggleBtn = page.locator("#toggleStrokes")

    await expect(canvas).toBeHidden()
    await toggleBtn.click()
    await expect(canvas).toBeVisible()
    await expect(toggleBtn).toHaveText("Hide strokes")

    await toggleBtn.click()
    await expect(canvas).toBeHidden()
    await expect(toggleBtn).toHaveText("Show strokes")
  })

  test.describe("with custom strokes", () => {
    test.beforeEach(async ({ page }) => {
      await page.locator("#toggleStrokes").click()
      await page.locator("#strokesToPlay").fill(JSON.stringify(playbackDemo.strokes))
    })

    test("should replay strokes end to end and settle back to idle", async ({ page }) => {
      await page.locator("#play").click()

      await expect(page.locator("#play")).toBeDisabled()
      await expect(page.locator("#pauseResume")).toBeEnabled()
      await expect(page.locator("#pauseResume")).toHaveText("Pause")
      await expect(page.locator("#stop")).toBeEnabled()

      await expect(page.locator("#progressLabel")).toHaveText("2 / 2 strokes", { timeout: 5000 })
      await expect(page.locator("#play")).toBeEnabled()
      await expect(page.locator("#pauseResume")).toBeDisabled()
      await expect(page.locator("#stop")).toBeDisabled()

      const symbols = await page.evaluate(() => rootEl.iink.model.symbols)
      expect(symbols).toHaveLength(2)
    })

    test("should defer pause until the in-progress stroke completes, then resume with it intact", async ({ page }) => {
      // Half speed: the first stroke (points at 0/500/1000ms) lasts 2 s. A fixed 300 ms wait at
      // full speed let a loaded run click after that stroke ended, and the pause applied at once.
      await page.locator("#speed").selectOption("0.5")
      await page.locator("#play").click()
      await expect.poll(() => page.evaluate(() => rootEl.iink.playback.state)).toEqual("playing")
      await page.locator("#pauseResume").click()

      // pause is only requested: still playing, still labeled "Pause", nothing cut short
      expect(await page.evaluate(() => rootEl.iink.playback.state)).toEqual("playing")
      await expect(page.locator("#pauseResume")).toHaveText("Pause")

      // once the current stroke's last point fires, the pause actually applies
      await expect(page.locator("#pauseResume")).toHaveText("Resume", { timeout: 6000 })
      expect(await page.evaluate(() => rootEl.iink.playback.state)).toEqual("paused")

      let symbols = await page.evaluate(() => rootEl.iink.model.symbols)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].pointers).toHaveLength(playbackDemo.strokes[0].pointers.length)

      await page.locator("#pauseResume").click()
      await expect(page.locator("#pauseResume")).toHaveText("Pause")

      await expect(page.locator("#progressLabel")).toHaveText("2 / 2 strokes", { timeout: 6000 })
      symbols = await page.evaluate(() => rootEl.iink.model.symbols)
      expect(symbols).toHaveLength(2)
    })

    test("should stop, finalize the in-progress stroke, and discard the rest", async ({ page }) => {
      // Half speed: only the first point of the first stroke (points at 0/500/1000ms) has fired
      // for its first second, wide enough for a loaded run to stop in it
      await page.locator("#speed").selectOption("0.5")
      await page.locator("#play").click()
      await expect.poll(() => page.evaluate(() => rootEl.iink.playback.state)).toEqual("playing")
      await page.locator("#stop").click()

      await expect(page.locator("#play")).toBeEnabled()
      await expect(page.locator("#pauseResume")).toBeDisabled()
      await expect(page.locator("#stop")).toBeDisabled()
      expect(await page.evaluate(() => rootEl.iink.playback.state)).toEqual("idle")

      // stop() finalizes the stroke left mid-progress instead of dropping it silently
      const symbols = await page.evaluate(() => rootEl.iink.model.symbols)
      expect(symbols).toHaveLength(1)
      expect(symbols[0].pointers.length).toBeLessThan(playbackDemo.strokes[0].pointers.length)
    })

    test("should change speed live while playing without breaking playback", async ({ page }) => {
      await page.locator("#play").click()
      await page.locator("#speed").selectOption("4")

      await expect(page.locator("#progressLabel")).toHaveText("2 / 2 strokes", { timeout: 3000 })
      const symbols = await page.evaluate(() => rootEl.iink.model.symbols)
      expect(symbols).toHaveLength(2)
    })
  })
})
