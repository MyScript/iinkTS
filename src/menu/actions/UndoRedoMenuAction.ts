import redoIcon from "@/assets/svg/redo.svg"
import undoIcon from "@/assets/svg/undo.svg"
import type { TInteractiveInkCanvas } from "@/canvas"

import { BaseMenuItem } from "../items/BaseMenuItem"

/**
 * @group Menu
 * @remarks Menu action Undo/Redo groupé
 */
export class UndoRedoMenuAction extends BaseMenuItem<HTMLDivElement> {
  private undoButton!: HTMLButtonElement
  private redoButton!: HTMLButtonElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config = {
      type: "undoredo" as const,
      id: `${idPrefix}-undoredo`,
      label: "Undo/Redo",
    }
    super(config, canvas)
  }

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: this.config.id,
      className: ["ms-menu-undoredo-group", "ms-menu-row"],
    })

    // Bouton Undo
    this.undoButton = this.dom.button({
      id: `${this.config.id}-undo`,
      className: "square",
      html: undoIcon,
    })
    this.undoButton.disabled = !this.canvas.history.context.canUndo
    this.undoButton.addEventListener("pointerup", async () => {
      this.logger.info(`${this.config.id}-undo.click`)
      try {
        await this.canvas.undo()
      } catch (error) {
        // An async listener's rejection goes nowhere: without this it surfaces as an unhandled
        // rejection to the integrator, and the user sees a click that silently did nothing.
        this.canvas.manageError(error as Error)
      }
    })

    // Bouton Redo
    this.redoButton = this.dom.button({
      id: `${this.config.id}-redo`,
      className: "square",
      html: redoIcon,
    })
    this.redoButton.disabled = !this.canvas.history.context.canRedo
    this.redoButton.addEventListener("pointerup", async () => {
      this.logger.info(`${this.config.id}-redo.click`)
      try {
        await this.canvas.redo()
      } catch (error) {
        // An async listener's rejection goes nowhere: without this it surfaces as an unhandled
        // rejection to the integrator, and the user sees a click that silently did nothing.
        this.canvas.manageError(error as Error)
      }
    })

    wrapper.appendChild(this.undoButton)
    wrapper.appendChild(this.redoButton)

    return wrapper
  }

  update(): void {
    if (this.undoButton) {
      this.undoButton.disabled = !this.canvas.history.context.canUndo
    }
    if (this.redoButton) {
      this.redoButton.disabled = !this.canvas.history.context.canRedo
    }
    this.updateDisabled()
    this.updateVisible()
  }
}
