import { CanvasFactory, InkCanvas, TInkCanvasOptions, TInkCanvasDeprecatedOptions } from "@/iink"

describe("CanvasFactory.ts", () => {
  const inkV2Options: TInkCanvasOptions = { configuration: { server: { version: "3.0.0" } } }
  const inkV1Options: TInkCanvasDeprecatedOptions = { configuration: { server: { version: "3.0.0" } } }

  afterEach(async () => {
    await CanvasFactory.clearInstances()
  })

  test("should throw when options is missing", async () => {
    // @ts-expect-error testing the runtime guard against a missing options argument
    await expect(CanvasFactory.createCanvas(document.createElement("div"), "INK_V2", undefined)).rejects.toThrow(
      "Param 'options' missing"
    )
  })

  test("should create and initialize the requested canvas variant", async () => {
    const canvas = await CanvasFactory.createCanvas(document.createElement("div"), "INK_V2", inkV2Options)
    expect(canvas).toBeInstanceOf(InkCanvas)
  })

  test("should register the created instance under its type", async () => {
    const canvas = await CanvasFactory.createCanvas(document.createElement("div"), "INK_V2", inkV2Options)
    expect(CanvasFactory.getInstanceByType("INK_V2")).toBe(canvas)
  })

  test("should return the most recently created instance from getInstance", async () => {
    await CanvasFactory.createCanvas(document.createElement("div"), "INK_V2", inkV2Options)
    const second = await CanvasFactory.createCanvas(document.createElement("div"), "INK_V1", inkV1Options)
    expect(CanvasFactory.getInstance()).toBe(second)
  })

  test("should destroy every previous instance before creating a new one, even of a different type", async () => {
    const first = await CanvasFactory.createCanvas(document.createElement("div"), "INK_V2", inkV2Options)
    const destroySpy = jest.spyOn(first, "destroy")

    await CanvasFactory.createCanvas(document.createElement("div"), "INK_V1", inkV1Options)

    expect(destroySpy).toHaveBeenCalledTimes(1)
    expect(CanvasFactory.getInstanceByType("INK_V2")).toBeUndefined()
  })

  test("should destroy all instances and clear the registry on clearInstances", async () => {
    const canvas = await CanvasFactory.createCanvas(document.createElement("div"), "INK_V2", inkV2Options)
    const destroySpy = jest.spyOn(canvas, "destroy")

    await CanvasFactory.clearInstances()

    expect(destroySpy).toHaveBeenCalledTimes(1)
    expect(CanvasFactory.getInstance()).toBeUndefined()
  })
})
