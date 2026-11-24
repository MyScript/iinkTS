import { BaseRenderer, TBaseRendererConfiguration } from "@/iink"

class TestRenderer extends BaseRenderer<HTMLElement> {
  init(): void {
    // no-op test double
  }
  clear(): void {
    // no-op test double
  }
  getRenderingContext(): HTMLElement {
    return this.parent
  }
}

describe("BaseRenderer.ts", () => {
  const configuration: TBaseRendererConfiguration = { minWidth: 200, minHeight: 100 }

  test("should store the given configuration", () => {
    const renderer = new TestRenderer(configuration)
    expect(renderer.configuration).toBe(configuration)
  })

  test("should return bounds anchored at the origin, sized to the configured minimums", () => {
    const renderer = new TestRenderer(configuration)
    expect(renderer.getBounds()).toEqual({ x: 0, y: 0, width: 200, height: 100 })
  })
})
