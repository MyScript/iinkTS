import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIOverlayManager, JIIXElementType, TJIIXMathElement } from "@/iink"

function buildMathElement(id: string): TJIIXMathElement {
  return {
    type: JIIXElementType.Math,
    id,
    "bounding-box": { x: 0, y: 0, width: 10, height: 10 },
  }
}

describe("IIOverlayManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IIOverlayManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("refresh()", () => {
    test("creates a hover zone for an unselected math block", () => {
      const canvas = createCanvasMock()
      canvas.model.exports = {
        "application/vnd.myscript.jiix": { type: "Text", id: "root", version: "3", elements: [buildMathElement("block-1")] },
      }
      canvas.selector.isMathBlockSelected = jest.fn().mockReturnValue(false)
      const manager = new IIOverlayManager(asCanvas(canvas))

      manager.refresh()

      expect(manager.renderer.layer.querySelector("#hover-zone-block-1")).not.toBeNull()
    })

    test("skips the hover zone for an already-selected math block, so it doesn't cover the selection's translate handle", () => {
      const canvas = createCanvasMock()
      canvas.model.exports = {
        "application/vnd.myscript.jiix": { type: "Text", id: "root", version: "3", elements: [buildMathElement("block-1")] },
      }
      canvas.selector.isMathBlockSelected = jest.fn().mockReturnValue(true)
      const manager = new IIOverlayManager(asCanvas(canvas))

      manager.refresh()

      expect(manager.renderer.layer.querySelector("#hover-zone-block-1")).toBeNull()
    })
  })

  describe("showVariableEncart / hideVariableEncart", () => {
    test("should append a group with one text line per item, centered on the anchor", () => {
      const canvas = createCanvasMock()
      const manager = new IIOverlayManager(asCanvas(canvas))

      manager.showVariableEncart({
        anchor: { x: 10, y: 20 },
        items: [{ name: "k", value: "5", typeLabel: "Global", typeColor: "#123456", swatchColor: "#abcdef" }],
      })

      const group = manager.renderer.layer.querySelector("#variable-encart")
      expect(group).not.toBeNull()
      expect(group?.querySelectorAll("text")).toHaveLength(1)
      expect(group?.querySelector("text")?.textContent).toBe("k: 5 · Global")
    })

    test("should render one swatch + one text line per item when several variables are shown", () => {
      const canvas = createCanvasMock()
      const manager = new IIOverlayManager(asCanvas(canvas))

      manager.showVariableEncart({
        anchor: { x: 0, y: 0 },
        items: [
          { name: "k", value: "5", typeLabel: "Global", typeColor: "#123456", swatchColor: "#aaaaaa" },
          { name: "pi", value: "3.14", typeLabel: "Predefined", typeColor: "#654321", swatchColor: "#bbbbbb" },
        ],
      })

      const group = manager.renderer.layer.querySelector("#variable-encart")
      expect(group?.querySelectorAll("text")).toHaveLength(2)
      expect(group?.querySelectorAll("rect")).toHaveLength(3) // background + one swatch per item
    })

    test("should not append anything when there are no items", () => {
      const canvas = createCanvasMock()
      const manager = new IIOverlayManager(asCanvas(canvas))

      manager.showVariableEncart({ anchor: { x: 0, y: 0 }, items: [] })

      expect(manager.renderer.layer.querySelector("#variable-encart")).toBeNull()
    })

    test("hideVariableEncart should remove the encart symbol", () => {
      const canvas = createCanvasMock()
      const manager = new IIOverlayManager(asCanvas(canvas))

      manager.hideVariableEncart()

      expect(canvas.renderer.removeSymbol).toHaveBeenCalledWith("variable-encart")
    })

    test("clearHighlights should also hide the variable encart", () => {
      const canvas = createCanvasMock()
      const manager = new IIOverlayManager(asCanvas(canvas))
      const hideSpy = jest.spyOn(manager, "hideVariableEncart")

      manager.clearHighlights()

      expect(hideSpy).toHaveBeenCalled()
    })
  })
})
