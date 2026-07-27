import { IIKeyboardManager, InteractiveInkCanvas, CanvasTool } from "@/iink"

describe("IIKeyboardManager", () => {
  let manager: IIKeyboardManager
  let mockCanvas: any

  beforeEach(() => {
    mockCanvas = {
      tool: CanvasTool.Write,
      model: { symbolsSelected: [] },
      copy: jest.fn(),
      paste: jest.fn(() => Promise.resolve()),
      cut: jest.fn(() => Promise.resolve()),
      undo: jest.fn(() => Promise.resolve()),
      redo: jest.fn(() => Promise.resolve()),
      removeSymbols: jest.fn(() => Promise.resolve()),
      zoomToFit: jest.fn(),
      renderer: {
        getZoom: jest.fn(() => 1),
        setZoom: jest.fn(),
        pan: jest.fn(),
        parent: { clientWidth: 800, clientHeight: 600 },
      },
      menu: {
        action: { update: jest.fn() },
      },
    }

    manager = new IIKeyboardManager(mockCanvas as InteractiveInkCanvas)
  })

  afterEach(() => {
    manager.detach()
  })

  describe("attach / detach", () => {
    it("should attach event listeners", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener")

      manager.attach()

      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it("should detach event listeners", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener")

      manager.attach()
      manager.detach()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe("handleKeyDown", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should switch to Move tool when Ctrl is pressed", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Move)
    })

    it("should switch to Move tool when Meta (Cmd) is pressed", () => {
      const event = new KeyboardEvent("keydown", { metaKey: true })
      window.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Move)
    })

    it("should not switch if already in Move mode", () => {
      mockCanvas.tool = CanvasTool.Move

      const event = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Move)
    })

    it("should not switch to Move when symbols are selected", () => {
      mockCanvas.tool = CanvasTool.Select
      mockCanvas.model.symbolsSelected = [{ id: "sym-1" }]

      const event = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Select)
    })

    it("should switch to Move when Ctrl pressed and no selection", () => {
      mockCanvas.tool = CanvasTool.Write
      mockCanvas.model.symbolsSelected = []

      const event = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Move)
    })

    it("should ignore keydown in INPUT elements", () => {
      const input = document.createElement("input")
      document.body.appendChild(input)

      const event = new KeyboardEvent("keydown", { ctrlKey: true, bubbles: true })
      Object.defineProperty(event, "target", { value: input, configurable: true })

      input.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Write)

      document.body.removeChild(input)
    })

    it("should ignore keydown in TEXTAREA elements", () => {
      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)

      const event = new KeyboardEvent("keydown", { ctrlKey: true, bubbles: true })
      Object.defineProperty(event, "target", { value: textarea, configurable: true })

      textarea.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Write)

      document.body.removeChild(textarea)
    })
  })

  describe("handleKeyUp", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should restore previous tool when Ctrl is released", () => {
      mockCanvas.tool = CanvasTool.Select

      // Press Ctrl to switch to Move
      const keydownEvent = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydownEvent)
      expect(mockCanvas.tool).toBe(CanvasTool.Move)

      // Release Ctrl to restore previous tool
      const keyupEvent = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(keyupEvent)

      expect(mockCanvas.tool).toBe(CanvasTool.Select)
    })

    it("should restore previous tool when Meta is released", () => {
      mockCanvas.tool = CanvasTool.Erase

      // Press Meta to switch to Move
      const keydownEvent = new KeyboardEvent("keydown", { metaKey: true })
      window.dispatchEvent(keydownEvent)
      expect(mockCanvas.tool).toBe(CanvasTool.Move)

      // Release Meta to restore previous tool
      const keyupEvent = new KeyboardEvent("keyup", { metaKey: false })
      window.dispatchEvent(keyupEvent)

      expect(mockCanvas.tool).toBe(CanvasTool.Erase)
    })

    it("should not restore tool if Ctrl was not pressed", () => {
      mockCanvas.tool = CanvasTool.Write

      const event = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(event)

      expect(mockCanvas.tool).toBe(CanvasTool.Write)
    })
  })

  describe("keyboard shortcut flow", () => {
    it("should handle complete Ctrl+Move flow", () => {
      manager.attach()

      mockCanvas.tool = CanvasTool.Write

      // Press Ctrl
      const keydown = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydown)
      expect(mockCanvas.tool).toBe(CanvasTool.Move)

      // Release Ctrl
      const keyup = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(keyup)
      expect(mockCanvas.tool).toBe(CanvasTool.Write)
    })

    it("should not switch twice if Ctrl is pressed multiple times", () => {
      manager.attach()

      mockCanvas.tool = CanvasTool.Select

      // First Ctrl press
      const keydown1 = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydown1)
      expect(mockCanvas.tool).toBe(CanvasTool.Move)

      // Second Ctrl press (holding)
      const keydown2 = new KeyboardEvent("keydown", { ctrlKey: true })
      window.dispatchEvent(keydown2)
      expect(mockCanvas.tool).toBe(CanvasTool.Move)

      // Release Ctrl
      const keyup = new KeyboardEvent("keyup", { ctrlKey: false })
      window.dispatchEvent(keyup)
      expect(mockCanvas.tool).toBe(CanvasTool.Select)
    })
  })

  describe("undo / redo shortcuts", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should call canvas.undo on Ctrl+Z", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "z" })
      window.dispatchEvent(event)
      expect(mockCanvas.undo).toHaveBeenCalledTimes(1)
      expect(mockCanvas.redo).not.toHaveBeenCalled()
    })

    it("should call canvas.redo on Ctrl+Shift+Z", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, key: "z" })
      window.dispatchEvent(event)
      expect(mockCanvas.redo).toHaveBeenCalledTimes(1)
      expect(mockCanvas.undo).not.toHaveBeenCalled()
    })

    it("should call canvas.redo on Ctrl+Y", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "y" })
      window.dispatchEvent(event)
      expect(mockCanvas.redo).toHaveBeenCalledTimes(1)
    })

    it("should call canvas.undo on Meta+Z (Mac)", () => {
      const event = new KeyboardEvent("keydown", { metaKey: true, key: "z" })
      window.dispatchEvent(event)
      expect(mockCanvas.undo).toHaveBeenCalledTimes(1)
    })

    it("should call canvas.redo on Meta+Shift+Z (Mac)", () => {
      const event = new KeyboardEvent("keydown", { metaKey: true, shiftKey: true, key: "z" })
      window.dispatchEvent(event)
      expect(mockCanvas.redo).toHaveBeenCalledTimes(1)
    })

    it("should NOT switch to Move tool on Ctrl+Z", () => {
      mockCanvas.tool = CanvasTool.Write
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "z" })
      window.dispatchEvent(event)
      expect(mockCanvas.tool).toBe(CanvasTool.Write)
    })
  })

  describe("copy / paste / cut shortcuts", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should call canvas.copy on Ctrl+C", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "c" })
      window.dispatchEvent(event)
      expect(mockCanvas.copy).toHaveBeenCalledTimes(1)
    })

    it("should call canvas.copy on Meta+C (Mac)", () => {
      const event = new KeyboardEvent("keydown", { metaKey: true, key: "c" })
      window.dispatchEvent(event)
      expect(mockCanvas.copy).toHaveBeenCalledTimes(1)
    })

    it("should call canvas.paste on Ctrl+V", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "v" })
      window.dispatchEvent(event)
      expect(mockCanvas.paste).toHaveBeenCalledTimes(1)
    })

    it("should call canvas.cut on Ctrl+X", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "x" })
      window.dispatchEvent(event)
      expect(mockCanvas.cut).toHaveBeenCalledTimes(1)
    })

    it("should NOT switch to Move tool on Ctrl+C", () => {
      mockCanvas.tool = CanvasTool.Write
      const event = new KeyboardEvent("keydown", { ctrlKey: true, key: "c" })
      window.dispatchEvent(event)
      expect(mockCanvas.tool).toBe(CanvasTool.Write)
    })

    it("should switch to Select tool on Ctrl+V and not restore previous tool on keyup", () => {
      mockCanvas.tool = CanvasTool.Write

      // Ctrl held → Move
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true }))
      expect(mockCanvas.tool).toBe(CanvasTool.Move)

      // Ctrl+V → Select immediately, clears #toolBeforeCtrl
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "v" }))
      expect(mockCanvas.tool).toBe(CanvasTool.Select)

      // Ctrl released → #toolBeforeCtrl is cleared → no restore
      window.dispatchEvent(new KeyboardEvent("keyup", { ctrlKey: false }))
      expect(mockCanvas.tool).toBe(CanvasTool.Select)
    })
  })

  describe("zoom shortcuts", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should call zoomToFit on Ctrl+0", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "0" }))
      expect(mockCanvas.zoomToFit).toHaveBeenCalledTimes(1)
      expect(mockCanvas.menu.action.update).toHaveBeenCalledTimes(1)
    })

    it("should call zoomToFit on Ctrl+à (AZERTY unshifted 0)", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "à" }))
      expect(mockCanvas.zoomToFit).toHaveBeenCalledTimes(1)
      expect(mockCanvas.menu.action.update).toHaveBeenCalledTimes(1)
    })

    it("should zoom in on Ctrl++", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "+" }))
      expect(mockCanvas.renderer.setZoom).toHaveBeenCalledWith(IIKeyboardManager.ZOOM_STEP, 400, 300)
      expect(mockCanvas.menu.action.update).toHaveBeenCalledTimes(1)
    })

    it("should zoom in on Ctrl+= (same physical key as +)", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "=" }))
      expect(mockCanvas.renderer.setZoom).toHaveBeenCalledWith(IIKeyboardManager.ZOOM_STEP, 400, 300)
    })

    it("should zoom out on Ctrl+-", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "-" }))
      expect(mockCanvas.renderer.setZoom).toHaveBeenCalledWith(1 / IIKeyboardManager.ZOOM_STEP, 400, 300)
      expect(mockCanvas.menu.action.update).toHaveBeenCalledTimes(1)
    })

    it("should compound zoom level correctly", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(2)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "+" }))
      expect(mockCanvas.renderer.setZoom).toHaveBeenCalledWith(2 * IIKeyboardManager.ZOOM_STEP, 400, 300)
    })
  })

  describe("pan shortcuts", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should pan up on Ctrl+ArrowUp", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "ArrowUp" }))
      expect(mockCanvas.renderer.pan).toHaveBeenCalledWith(0, -IIKeyboardManager.PAN_STEP)
    })

    it("should pan down on Ctrl+ArrowDown", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "ArrowDown" }))
      expect(mockCanvas.renderer.pan).toHaveBeenCalledWith(0, IIKeyboardManager.PAN_STEP)
    })

    it("should pan left on Ctrl+ArrowLeft", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "ArrowLeft" }))
      expect(mockCanvas.renderer.pan).toHaveBeenCalledWith(-IIKeyboardManager.PAN_STEP, 0)
    })

    it("should pan right on Ctrl+ArrowRight", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(1)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "ArrowRight" }))
      expect(mockCanvas.renderer.pan).toHaveBeenCalledWith(IIKeyboardManager.PAN_STEP, 0)
    })

    it("should adjust pan step by zoom level", () => {
      mockCanvas.renderer.getZoom.mockReturnValue(2)
      window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "ArrowRight" }))
      expect(mockCanvas.renderer.pan).toHaveBeenCalledWith(IIKeyboardManager.PAN_STEP / 2, 0)
    })
  })

  describe("delete shortcuts", () => {
    beforeEach(() => {
      manager.attach()
    })

    it("should call removeSymbols on Delete when symbols are selected", () => {
      const fakeSymbol = { id: "sym-1" }
      mockCanvas.model.symbolsSelected = [fakeSymbol]

      const event = new KeyboardEvent("keydown", { key: "Delete" })
      window.dispatchEvent(event)

      expect(mockCanvas.removeSymbols).toHaveBeenCalledWith(["sym-1"])
    })

    it("should call removeSymbols on Backspace when symbols are selected", () => {
      const fakeSymbol = { id: "sym-2" }
      mockCanvas.model.symbolsSelected = [fakeSymbol]

      const event = new KeyboardEvent("keydown", { key: "Backspace" })
      window.dispatchEvent(event)

      expect(mockCanvas.removeSymbols).toHaveBeenCalledWith(["sym-2"])
    })

    it("should not call removeSymbols on Delete when nothing selected", () => {
      mockCanvas.model.symbolsSelected = []

      const event = new KeyboardEvent("keydown", { key: "Delete" })
      window.dispatchEvent(event)

      expect(mockCanvas.removeSymbols).not.toHaveBeenCalled()
    })
  })
})
