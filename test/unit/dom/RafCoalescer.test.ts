import { RafCoalescer } from "@/iink"

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

describe("RafCoalescer", () => {
  test("should run the scheduled callback on the next animation frame", async () => {
    const coalescer = new RafCoalescer()
    const callback = jest.fn()

    coalescer.schedule(callback)
    expect(callback).not.toHaveBeenCalled()

    await nextFrame()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("should coalesce several schedule() calls within the same frame into a single run", async () => {
    const coalescer = new RafCoalescer()
    const first = jest.fn()
    const second = jest.fn()
    const third = jest.fn()

    coalescer.schedule(first)
    coalescer.schedule(second)
    coalescer.schedule(third)

    await nextFrame()
    expect(first).not.toHaveBeenCalled()
    expect(second).not.toHaveBeenCalled()
    expect(third).toHaveBeenCalledTimes(1)
  })

  test("should allow scheduling again after a run completes", async () => {
    const coalescer = new RafCoalescer()
    const first = jest.fn()
    const second = jest.fn()

    coalescer.schedule(first)
    await nextFrame()
    coalescer.schedule(second)
    await nextFrame()

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  test("should not run a cancelled callback", async () => {
    const coalescer = new RafCoalescer()
    const callback = jest.fn()

    coalescer.schedule(callback)
    coalescer.cancel()

    await nextFrame()
    expect(callback).not.toHaveBeenCalled()
  })

  test("should be a no-op to cancel when nothing is scheduled", () => {
    const coalescer = new RafCoalescer()
    expect(() => coalescer.cancel()).not.toThrow()
  })
})
