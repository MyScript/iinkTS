import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import { IIOverlayManager } from "@/iink"

describe("IIOverlayManager.ts", () => {
  test("should create", () => {
    const editor = createCanvasMock()
    const manager = new IIOverlayManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  describe("showVariableEncart / hideVariableEncart", () => {
    test("should append a group with one text line per item, centered on the anchor", () => {
      const editor = createCanvasMock()
      const manager = new IIOverlayManager(asEditor(editor))

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
      const editor = createCanvasMock()
      const manager = new IIOverlayManager(asEditor(editor))

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
      const editor = createCanvasMock()
      const manager = new IIOverlayManager(asEditor(editor))

      manager.showVariableEncart({ anchor: { x: 0, y: 0 }, items: [] })

      expect(manager.renderer.layer.querySelector("#variable-encart")).toBeNull()
    })

    test("hideVariableEncart should remove the encart symbol", () => {
      const editor = createCanvasMock()
      const manager = new IIOverlayManager(asEditor(editor))

      manager.hideVariableEncart()

      expect(editor.renderer.removeSymbol).toHaveBeenCalledWith("variable-encart")
    })

    test("clearHighlights should also hide the variable encart", () => {
      const editor = createCanvasMock()
      const manager = new IIOverlayManager(asEditor(editor))
      const hideSpy = jest.spyOn(manager, "hideVariableEncart")

      manager.clearHighlights()

      expect(hideSpy).toHaveBeenCalled()
    })
  })
})
