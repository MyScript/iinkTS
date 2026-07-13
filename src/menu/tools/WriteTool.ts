import pencilIcon from "@/assets/svg/edit-pencil.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool, CanvasWriteTool } from "@/Constants"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Write tool - Pencil drawing
 */
export class WriteTool extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-tool") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-write-pencil`,
      label: "Write",
      icon: pencilIcon,
      action: (canvas: TInteractiveInkCanvas) => {
        canvas.tool = CanvasTool.Write
        canvas.writer.tool = CanvasWriteTool.Pencil
      },
    }
    super(config, canvas)
  }

  createElement(): HTMLButtonElement {
    const button = this.dom.button({
      id: this.config.id,
      html: this.config.icon || "",
      className: "square",
    })
    button.addEventListener("click", () => {
      this.unselectAll()
      button.classList.add("active")
      this.config.action(this.canvas)
    })
    return button
  }

  update(): void {
    if (!this.element) {
      return
    }

    const isActive = this.canvas.tool === CanvasTool.Write && this.canvas.writer.tool === CanvasWriteTool.Pencil

    if (isActive) {
      this.element.classList.add("active")
    } else {
      this.element.classList.remove("active")
    }

    this.updateDisabled()
    this.updateVisible()
  }

  private unselectAll(): void {
    const menu = this.element?.closest(".ms-menu")
    menu?.querySelectorAll("*").forEach((e) => e.classList.remove("active"))
  }
}
