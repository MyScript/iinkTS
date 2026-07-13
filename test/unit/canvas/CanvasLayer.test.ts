import { CanvasLayer } from "@/canvas/CanvasLayer"

describe("CanvasLayer.ts", () => {
  describe("editor state badge", () => {
    let layer: CanvasLayer

    beforeEach(() => {
      layer = new CanvasLayer(document.createElement("div"))
    })

    test("should render a hidden-count badge for online-idle", () => {
      layer.updateCanvasState("online-idle", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.root.className).toEqual("ms-ink-state ms-ink-state-online-idle")
      expect(layer.ui.state.tooltip.textContent).toEqual("Connected")
      expect(layer.ui.state.count.style.display).toEqual("none")
    })

    test("should show the queued count with an explanatory tooltip for syncing", () => {
      layer.updateCanvasState("syncing", { queuedCount: 3, activeOperations: [] })
      expect(layer.ui.state.root.className).toEqual("ms-ink-state ms-ink-state-syncing")
      expect(layer.ui.state.count.textContent).toEqual("3")
      expect(layer.ui.state.count.style.display).toEqual("flex")
      expect(layer.ui.state.tooltip.textContent).toContain("3 stroke batch(es) waiting to be sent")
    })

    test("should hide the count when syncing has nothing queued yet", () => {
      layer.updateCanvasState("syncing", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.count.style.display).toEqual("none")
    })

    test("should list active operation labels in the tooltip when online-working", () => {
      layer.updateCanvasState("online-working", { queuedCount: 0, activeOperations: ["Converting", "Synchronizing"] })
      expect(layer.ui.state.tooltip.textContent).toEqual("Converting, Synchronizing")
      expect(layer.ui.state.count.style.display).toEqual("none")
    })

    test("should fall back to the generic tooltip when online-working has no labels yet", () => {
      layer.updateCanvasState("online-working", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.tooltip.textContent).toEqual("Processing…")
    })

    test("should update the icon markup for each state", () => {
      layer.updateCanvasState("error", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.icon.innerHTML).not.toEqual("")
      const errorIcon = layer.ui.state.icon.innerHTML
      layer.updateCanvasState("offline", { queuedCount: 0, activeOperations: [] })
      expect(layer.ui.state.icon.innerHTML).not.toEqual(errorIcon)
    })

    test("should toggle the tooltip open on click and close it on an outside click", () => {
      const { root, tooltip } = layer.ui.state
      expect(tooltip.classList.contains("open")).toBe(false)

      root.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(true)

      document.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(false)
    })

    test("should toggle the tooltip closed on a second click on the badge", () => {
      const { root, tooltip } = layer.ui.state
      root.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(true)

      root.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
      expect(tooltip.classList.contains("open")).toBe(false)
    })

    test("should remove the document click listener on destroy", () => {
      const removeSpy = jest.spyOn(document, "removeEventListener")
      layer.destroy()
      expect(removeSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function))
      removeSpy.mockRestore()
    })
  })
})
