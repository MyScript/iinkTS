import { DefaultInkCanvasConfiguration, IDebugSVGManager, InkCanvas, TBox, TInkCanvasOptions } from "@/iink"

class TestableIDebugSVGManager extends IDebugSVGManager {
  callDrawRecognitionBox(box: TBox, infos: string[], color: string, debugAttr: string): void {
    this.drawRecognitionBox(box, infos, color, debugAttr)
  }
}

describe("IDebugSVGManager.ts", () => {
  const options: TInkCanvasOptions = {
    configuration: DefaultInkCanvasConfiguration,
  }
  const box: TBox = { x: 0, y: 0, width: 10, height: 10 }

  Object.defineProperty(global.SVGElement.prototype, "getBBox", {
    writable: true,
    value: jest.fn().mockReturnValue({ x: 0, y: 0, width: 10, height: 10 }),
  })

  describe("drawRecognitionBox", () => {
    test("should reuse the same listener references across drags instead of registering new ones", async () => {
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const canvas = new InkCanvas(document.createElement("div"), options)
      await canvas.initialize()
      const debugManager = new TestableIDebugSVGManager(canvas)
      debugManager.callDrawRecognitionBox(box, ["info"], "red", "recognition-box")

      const rectTranslate = canvas.renderer.layer.querySelector('rect[style="cursor:move"]')
      expect(rectTranslate).not.toBeNull()

      const addSpy = jest.spyOn(canvas.renderer.layer, "addEventListener")

      rectTranslate?.dispatchEvent(new MouseEvent("pointerdown", { clientX: 1, clientY: 1 }))
      const firstDragListeners = addSpy.mock.calls.map(([, listener]) => listener)
      expect(firstDragListeners).toHaveLength(4)

      addSpy.mockClear()
      rectTranslate?.dispatchEvent(new MouseEvent("pointerdown", { clientX: 2, clientY: 2 }))
      const secondDragListeners = addSpy.mock.calls.map(([, listener]) => listener)

      expect(secondDragListeners).toEqual(firstDragListeners)
    })

    test("should remove pointermove and its own end listeners on pointerup", async () => {
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const canvas = new InkCanvas(document.createElement("div"), options)
      await canvas.initialize()
      const debugManager = new TestableIDebugSVGManager(canvas)
      debugManager.callDrawRecognitionBox(box, ["info"], "red", "recognition-box")

      const rectTranslate = canvas.renderer.layer.querySelector('rect[style="cursor:move"]')
      rectTranslate?.dispatchEvent(new MouseEvent("pointerdown", { clientX: 1, clientY: 1 }))

      const removeSpy = jest.spyOn(canvas.renderer.layer, "removeEventListener")
      canvas.renderer.layer.dispatchEvent(new MouseEvent("pointerup"))

      const removedTypes = removeSpy.mock.calls.map(([type]) => type)
      expect(removedTypes.sort()).toEqual(["pointercancel", "pointerleave", "pointermove", "pointerup"].sort())
    })
  })
})
