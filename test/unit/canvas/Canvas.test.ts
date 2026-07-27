jest.mock("@/canvas/variants/InkCanvasDeprecated")
jest.mock("@/canvas/variants/InteractiveInkSSRCanvas")
jest.mock("@/canvas/variants/InteractiveInkCanvas")

import { Canvas, InteractiveInkCanvas, InkCanvasDeprecated, InteractiveInkSSRCanvas } from "@/iink"

describe("Canvas.ts", () => {
  const element = document.createElement("div")

  test("should thorw error if no options", async () => {
    //@ts-ignore
    await expect(() => Canvas.load(element, "INK_V1")).rejects.toEqual(new Error(`Param 'options' missing`))
  })

  test("should load Ink Canvas v1", async () => {
    const canvas = await Canvas.load(element, "INK_V1", {})
    expect(Canvas.getInstance()).toBe(canvas)
    expect(canvas).toBeInstanceOf(InkCanvasDeprecated)
    expect(canvas).not.toBeInstanceOf(InteractiveInkSSRCanvas)
    expect(canvas).not.toBeInstanceOf(InteractiveInkCanvas)
    expect(canvas.initialize).toHaveBeenCalledTimes(1)
  })
  test("should load Interactive Ink Canvas SSR", async () => {
    const canvas = await Canvas.load(element, "INTERACTIVE_INK_SSR", {})
    expect(Canvas.getInstance()).toBe(canvas)
    expect(canvas).not.toBeInstanceOf(InkCanvasDeprecated)
    expect(canvas).toBeInstanceOf(InteractiveInkSSRCanvas)
    expect(canvas).not.toBeInstanceOf(InteractiveInkCanvas)
    expect(canvas.initialize).toHaveBeenCalledTimes(1)
  })
  test("should load Interactive Ink Canvas", async () => {
    const canvas = await Canvas.load(element, "INTERACTIVE_INK", {})
    expect(Canvas.getInstance()).toBe(canvas)
    expect(canvas).not.toBeInstanceOf(InkCanvasDeprecated)
    expect(canvas).not.toBeInstanceOf(InteractiveInkSSRCanvas)
    expect(canvas).toBeInstanceOf(InteractiveInkCanvas)
    expect(canvas.initialize).toHaveBeenCalledTimes(1)
  })
})
