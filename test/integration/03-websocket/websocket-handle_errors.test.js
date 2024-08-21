  describe("Websocket Text", () => {
    beforeAll(async () => {
      await page.goto("/examples/websocket/websocket_handle_errors.html")
      await page.waitForSelector(".message-modal")
    })

    test("should have title", async () => {

      const title = await page.title()
      expect(title).toMatch("Handle error")
    })

    test("should have error message", async () => {
        const errorMessage = await page.locator(".message-modal.error-msg").textContent()
        expect(errorMessage).toContain("Application credentials are invalid. Please check or regenerate your application key and hmackey.")
    })
  })
