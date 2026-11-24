import { LeftClickEventMock } from "../__mocks__/EventMock"
import { type InteractiveInkCanvas, Minimap } from "@/iink"

function buildMockCanvas(overrides: Partial<any> = {}): InteractiveInkCanvas {
  const mockMainLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  return {
    model: { symbols: [] },
    configuration: { cssVars: undefined },
    renderer: {
      getRenderingContext: jest.fn(() => mockMainLayer),
      getViewBox: jest.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
      getBounds: jest.fn(() => ({ x: 0, y: 0, width: 1000, height: 1000 })),
      setViewBox: jest.fn(),
    },
    getSymbolsBounds: jest.fn(() => ({ x: 10, y: 20, width: 200, height: 100 })),
    ...overrides,
  } as unknown as InteractiveInkCanvas
}

describe("Minimap", () => {
  describe("constructor", () => {
    it("should create container with default dimensions", () => {
      const minimap = new Minimap(buildMockCanvas())
      const el = minimap.getElement()
      expect(el.style.width).toBe(`${Minimap.DEFAULT_WIDTH}px`)
      expect(el.style.height).toBe(`${Minimap.DEFAULT_HEIGHT}px`)
    })

    it("should create container with custom dimensions", () => {
      const minimap = new Minimap(buildMockCanvas(), { width: 300, height: 200 })
      const el = minimap.getElement()
      expect(el.style.width).toBe("300px")
      expect(el.style.height).toBe("200px")
    })

    it("should contain an SVG element", () => {
      const minimap = new Minimap(buildMockCanvas())
      const svg = minimap.getElement().querySelector("svg")
      expect(svg).not.toBeNull()
    })
  })

  describe("getElement", () => {
    it("should return the same container element each time", () => {
      const minimap = new Minimap(buildMockCanvas())
      expect(minimap.getElement()).toBe(minimap.getElement())
    })
  })

  describe("attach", () => {
    it("should append element to the given parent", () => {
      const parent = document.createElement("div")
      document.body.appendChild(parent)
      const minimap = new Minimap(buildMockCanvas())

      minimap.attach(parent)

      expect(parent.contains(minimap.getElement())).toBe(true)
      parent.remove()
    })

    it("should call getViewBox and getBounds on attach", () => {
      const parent = document.createElement("div")
      document.body.appendChild(parent)
      const canvas = buildMockCanvas()
      const minimap = new Minimap(canvas)

      minimap.attach(parent)

      expect(canvas.renderer.getViewBox).toHaveBeenCalled()
      expect(canvas.renderer.getBounds).toHaveBeenCalled()
      parent.remove()
    })
  })

  describe("detach", () => {
    it("should remove element from DOM", () => {
      const parent = document.createElement("div")
      document.body.appendChild(parent)
      const minimap = new Minimap(buildMockCanvas())
      minimap.attach(parent)

      minimap.detach()

      expect(parent.contains(minimap.getElement())).toBe(false)
      parent.remove()
    })
  })

  describe("destroy", () => {
    it("should remove element from DOM", () => {
      const parent = document.createElement("div")
      document.body.appendChild(parent)
      const minimap = new Minimap(buildMockCanvas())
      minimap.attach(parent)

      minimap.destroy()

      expect(parent.contains(minimap.getElement())).toBe(false)
      parent.remove()
    })
  })

  describe("navigation", () => {
    it("should call setViewBox when clicking the minimap", () => {
      const parent = document.createElement("div")
      document.body.appendChild(parent)
      const canvas = buildMockCanvas()
      const minimap = new Minimap(canvas, { width: 200, height: 150 })
      minimap.attach(parent)

      const el = minimap.getElement()
      const event = new LeftClickEventMock("pointerdown", {
        clientX: 100,
        clientY: 75,
        pressure: 1,
        pointerType: "mouse",
      })
      el.dispatchEvent(event)

      expect(canvas.renderer.setViewBox).toHaveBeenCalled()
      parent.remove()
    })
  })

  describe("mutation sync throttling", () => {
    it("coalesces multiple mutation batches within the same animation frame into a single sync", async () => {
      const canvas = buildMockCanvas()
      new Minimap(canvas)
      const mainLayer = canvas.renderer.getRenderingContext()

      mainLayer.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"))
      await Promise.resolve()
      mainLayer.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"))
      await Promise.resolve()

      // Both mutations landed before the animation frame fired — sync must not have run yet.
      expect(canvas.renderer.getBounds).not.toHaveBeenCalled()

      await new Promise((resolve) => requestAnimationFrame(resolve))

      expect(canvas.renderer.getBounds).toHaveBeenCalledTimes(1)
    })

    it("does not sync after destroy even if a frame was already scheduled", async () => {
      const canvas = buildMockCanvas()
      const minimap = new Minimap(canvas)
      const mainLayer = canvas.renderer.getRenderingContext()

      mainLayer.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"))
      await Promise.resolve()

      minimap.destroy()
      await new Promise((resolve) => requestAnimationFrame(resolve))

      expect(canvas.renderer.getBounds).not.toHaveBeenCalled()
    })
  })

  describe("DEFAULT_WIDTH / DEFAULT_HEIGHT", () => {
    it("should have sensible defaults", () => {
      expect(Minimap.DEFAULT_WIDTH).toBeGreaterThan(0)
      expect(Minimap.DEFAULT_HEIGHT).toBeGreaterThan(0)
    })
  })
})
