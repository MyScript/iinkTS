import { test, expect } from "@playwright/test"
import { passModalKey, writeStrokes, waitForSynchronizedEvent, getCanvasSymbols, callCanvasExport } from "../helper"
import helloOneStroke from "../__dataset__/helloOneStroke"
import madrid from "../__dataset__/madrid"

/**
 * What the user does while the connection is down must reach the server once it is back: every
 * change is queued and replayed in order, and a request waits for the reconnection.
 *
 * The recognition websocket goes through `page.routeWebSocket`, a proxy to the real server: closing
 * its page side with 1006 is what a network drop looks like to the client. While `network.down` is
 * set, every reconnection attempt is dropped the same way, so the changes pile up in the queue for
 * as long as the test needs; clearing it lets the client's next attempt through.
 */
test.describe("Interactive ink canvas connection drop", () => {
  const routes = []
  const network = { down: false }

  test.beforeEach(async ({ page }) => {
    routes.length = 0
    network.down = false
    await page.routeWebSocket(/\/api\/v4\.0\/iink\/offscreen/, (ws) => {
      if (network.down) {
        ws.close({ code: 1006, reason: "network down" })
        return
      }
      const server = ws.connectToServer()
      routes.push({ ws, server })
    })
    await page.goto(`${process.env.PATH_PREFIX ? process.env.PATH_PREFIX : ""}/examples/interactive-canvas/interactive_canvas_get_started.html`)
    await passModalKey(page)
  })

  test("should replay the changes made while disconnected once reconnected", async ({ page }) => {
    await Promise.all([waitForSynchronizedEvent(page), writeStrokes(page, helloOneStroke.strokes)])
    const [hello] = await getCanvasSymbols(page)

    const { ws, server } = routes.at(-1)
    network.down = true
    await ws.close({ code: 1006, reason: "network drop" })
    await server.close()
    await expect.poll(() => page.evaluate(() => rootEl.iink.isOffline)).toBe(true)

    // Changes made offline: a stroke written, another removed — neither may be lost
    await writeStrokes(page, madrid.strokes)
    await page.evaluate((id) => rootEl.iink.removeSymbol(id), hello.id)
    await expect.poll(() => page.evaluate(() => rootEl.iink.client.offlineQueueLength)).toBeGreaterThan(0)
    // The error modal is for connections that cannot come back, not for a drop the client recovers from
    await expect(page.locator(".ms-modal")).toHaveCount(0)

    // The network comes back: the client's next attempt (reconnectDelay) gets through and replays
    // the queue before the export
    network.down = false
    await expect.poll(() => page.evaluate(() => rootEl.iink.isOffline), { timeout: 20000 }).toBe(false)
    const jiix = await callCanvasExport(page, "application/vnd.myscript.jiix")

    // Only what was written offline is left: "hello", removed offline, is gone from the server too
    expect(jiix.elements).toHaveLength(1)
    expect(jiix.elements[0].label).toEqual(madrid.exports["application/vnd.myscript.jiix"].label)
    expect(routes.length).toBeGreaterThan(1)
  })
})
