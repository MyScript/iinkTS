describe("ping.worker.ts", () => {
  beforeAll(async () => {
    jest.useFakeTimers()
    await import("@/worker/ping.worker")
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  test("should keep a single ping interval when it is configured twice", () => {
    const postMessageSpy = jest.spyOn(self, "postMessage").mockImplementation(() => undefined)
    self.dispatchEvent(new MessageEvent("message", { data: { pingDelay: 100 } }))
    self.dispatchEvent(new MessageEvent("message", { data: { pingDelay: 100 } }))

    jest.advanceTimersByTime(100)

    expect(postMessageSpy).toHaveBeenCalledTimes(1)
  })
})
