  describe("Websocket Text", () => {
    beforeAll(async () => {
      await page.goto("/examples/websocket/websocket_handle_errors.html")
      await page.waitForSelector(".message")
    })

    test("should have title", async () => {

      const title = await page.title()
      expect(title).toMatch("Handle error")
    })

    test("should have error message", async () => {
        const errorMessage = await page.locator(".message.error-msg").textContent()
        expect(errorMessage).toStrictEqual("Application credentials are invalid. Please check or regenerate your application key and hmackey.")
    })
  })
