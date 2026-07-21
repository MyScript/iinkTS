import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool } from "@/Constants"
import { LoggerCategory } from "@/logger"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * Manages keyboard input for the Interactive Ink canvas
 * Handles tool switching via modifier keys (Ctrl/Cmd for Move mode)
 * @group Manager
 */
export class IIKeyboardManager extends IIAbstractManager {
  protected managerName = "IIKeyboardManager"

  static readonly ZOOM_STEP = 1.2
  static readonly PAN_STEP = 100

  #toolBeforeCtrl?: CanvasTool

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.KEYBOARD)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  /**
   * Attach keyboard event listeners to the window
   */
  attach(): void {
    this.logger.info("attach")
    window.addEventListener("keydown", this.handleKeyDown)
    window.addEventListener("keyup", this.handleKeyUp)
  }

  /**
   * Detach keyboard event listeners from the window
   */
  detach(): void {
    this.logger.info("detach")
    window.removeEventListener("keydown", this.handleKeyDown)
    window.removeEventListener("keyup", this.handleKeyUp)
  }

  /**
   * Reset the stored tool when user manually changes tool
   * Called by the canvas when tool changes programmatically
   */
  resetStoredTool(): void {
    if (this.#toolBeforeCtrl) {
      this.#toolBeforeCtrl = undefined
    }
  }

  #zoomAtCenter(factor: number): void {
    const cx = this.canvas.renderer.parent.clientWidth / 2
    const cy = this.canvas.renderer.parent.clientHeight / 2
    this.canvas.renderer.setZoom(this.canvas.renderer.getZoom() * factor, cx, cy)
    this.canvas.menu.action.update()
  }

  #handleCtrlShortcut(event: KeyboardEvent): boolean {
    switch (event.key.toLowerCase()) {
      case "z":
        event.preventDefault()
        if (event.shiftKey) {
          this.canvas.redo()
        } else {
          this.canvas.undo()
        }
        return true
      case "y":
        event.preventDefault()
        this.canvas.redo()
        return true
      case "c":
        event.preventDefault()
        this.canvas.copy()
        return true
      case "v":
        event.preventDefault()
        this.#toolBeforeCtrl = undefined
        this.canvas.tool = CanvasTool.Select
        this.canvas.paste()
        return true
      case "x":
        event.preventDefault()
        this.canvas.cut()
        return true
      case "0":
      case "à": // AZERTY: unshifted value of the 0 key
        event.preventDefault()
        this.canvas.zoomToFit()
        this.canvas.menu.action.update()
        return true
      case "+":
      case "=":
        event.preventDefault()
        this.#zoomAtCenter(IIKeyboardManager.ZOOM_STEP)
        return true
      case "-":
        event.preventDefault()
        this.#zoomAtCenter(1 / IIKeyboardManager.ZOOM_STEP)
        return true
      case "arrowup":
        event.preventDefault()
        this.canvas.renderer.pan(0, -IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom())
        return true
      case "arrowdown":
        event.preventDefault()
        this.canvas.renderer.pan(0, IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom())
        return true
      case "arrowleft":
        event.preventDefault()
        this.canvas.renderer.pan(-IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom(), 0)
        return true
      case "arrowright":
        event.preventDefault()
        this.canvas.renderer.pan(IIKeyboardManager.PAN_STEP / this.canvas.renderer.getZoom(), 0)
        return true
      default:
        return false
    }
  }

  #handleDelete(event: KeyboardEvent): void {
    const selected = this.canvas.model.symbolsSelected
    if (selected.length) {
      event.preventDefault()
      this.canvas.removeSymbols(selected.map((s) => s.id))
    }
  }

  /**
   * Handle keydown events
   * Handles copy/paste/cut shortcuts and Delete key; switches to Move tool when Ctrl/Cmd is pressed
   */
  protected handleKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return
    }

    if (event.ctrlKey || event.metaKey) {
      if (this.#handleCtrlShortcut(event)) {
        return
      }
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      this.#handleDelete(event)
      return
    }

    const hasSelection = this.canvas.model.symbolsSelected.length > 0
    if (
      (event.ctrlKey || event.metaKey) &&
      this.canvas.tool !== CanvasTool.Move &&
      !this.#toolBeforeCtrl &&
      !hasSelection
    ) {
      this.logger.debug("handleKeyDown", "Switching to Move mode")
      this.#toolBeforeCtrl = this.canvas.tool
      this.canvas.tool = CanvasTool.Move
    }
  }

  /**
   * Handle keyup events
   * Restores previous tool when Ctrl/Cmd is released
   */
  protected handleKeyUp = (event: KeyboardEvent): void => {
    if (!event.ctrlKey && !event.metaKey && this.#toolBeforeCtrl) {
      this.logger.debug("handleKeyUp", "Restoring previous tool")
      this.canvas.tool = this.#toolBeforeCtrl
      this.#toolBeforeCtrl = undefined
    }
  }
}
