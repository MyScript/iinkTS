import { InkCanvas, TInkCanvasOptions, DefaultInkCanvasConfiguration, TPointerInfo } from "@/iink"

describe("IWriterManager.ts", () => {
  const buildCanvas = () => {
    const options: TInkCanvasOptions = { configuration: structuredClone(DefaultInkCanvasConfiguration) }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InkCanvas(document.createElement("div"), options)
    canvas.renderer.drawSymbol = jest.fn()
    return canvas
  }

  const pointerInfo = { pointer: { dt: 1, p: 0.5, x: 1, y: 1 } } as TPointerInfo

  describe("the debounced auto-export", () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test("should route a failing auto-export through the error event instead of leaving it unhandled", async () => {
      const canvas = buildCanvas()
      const boom = new Error("export refused")
      canvas.export = jest.fn().mockRejectedValue(boom)
      const emitError = jest.spyOn(canvas.event, "emitError")

      canvas.writer.start(pointerInfo)
      await canvas.writer.end(pointerInfo)
      await jest.advanceTimersByTimeAsync(canvas.configuration.triggers.exportContentDelay)

      expect(canvas.export).toHaveBeenCalledTimes(1)
      expect(emitError).toHaveBeenCalledWith(boom)
    })

    test("should still export on a successful stroke", async () => {
      const canvas = buildCanvas()
      canvas.export = jest.fn().mockResolvedValue(undefined)
      const emitError = jest.spyOn(canvas.event, "emitError")

      canvas.writer.start(pointerInfo)
      await canvas.writer.end(pointerInfo)
      await jest.advanceTimersByTimeAsync(canvas.configuration.triggers.exportContentDelay)

      expect(canvas.export).toHaveBeenCalledTimes(1)
      expect(emitError).not.toHaveBeenCalled()
    })

    test("should not export at all when the trigger is DEMAND", async () => {
      const canvas = buildCanvas()
      canvas.configuration.triggers.exportContent = "DEMAND"
      canvas.export = jest.fn().mockResolvedValue(undefined)

      canvas.writer.start(pointerInfo)
      await canvas.writer.end(pointerInfo)
      await jest.advanceTimersByTimeAsync(5000)

      expect(canvas.export).not.toHaveBeenCalled()
    })
  })
})
