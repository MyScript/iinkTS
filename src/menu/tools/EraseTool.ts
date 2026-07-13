import eraseIcon from "@/assets/svg/erase.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool } from "@/Constants"
import type { TMenuItemBase } from "@/menu/items/BaseMenuItem"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { DEFAULT_ERASER_SIZE_LIST } from "@/menu/MenuConstants"

/**
 * @group Menu
 */
type TEraseToolConfig = TMenuItemBase & {
  type: "erase"
}

/**
 * @group Menu
 * @remarks Erase tool - Element erasure with configurable size
 */
export class EraseTool extends BaseMenuItem<HTMLDivElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  private sizeButtons: Map<number, HTMLButtonElement> = new Map()
  private triggerButton?: HTMLButtonElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-tool") {
    const config: TEraseToolConfig = {
      type: "erase",
      id: `${idPrefix}-erase`,
      label: "Erase",
    }
    super(config, canvas)
  }

  private createEraserSizeIcon(value: number): string {
    const radii: Record<number, number> = {
      5: 3,
      10: 5,
      20: 7,
      40: 9,
    }
    const r = radii[value] ?? Math.round(Math.log2(value))
    return `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="${r}" fill="currentColor"/></svg>`
  }

  private createSizeButton(label: string, value: number): HTMLButtonElement {
    const button = this.dom.button({
      id: `${this.config.id}-${value}`,
      className: "square",
      html: this.createEraserSizeIcon(value),
    })
    button.title = `${label} (${value}px)`

    button.addEventListener("click", () => {
      this.unselectAll()
      this.canvas.eraser.eraserWidth = value
      this.canvas.tool = CanvasTool.Erase
      this.triggerButton?.classList.add("active")
      this.element?.querySelector(".sub-menu-content")?.classList.remove("open")
    })

    this.sizeButtons.set(value, button)
    return button
  }

  createElement(): HTMLDivElement {
    this.triggerButton = this.dom.button({
      id: this.config.id,
      className: "square",
      html: eraseIcon,
    })

    const subMenuContent = this.dom.div({
      id: `${this.config.id}-list`,
      className: ["ms-menu-row", "sub-menu-content-erase"],
    })
    DEFAULT_ERASER_SIZE_LIST.forEach(({ label, value }) => {
      subMenuContent.appendChild(this.createSizeButton(label, value))
    })

    const content = this.dom.div({
      className: ["sub-menu-content", "top"],
    })
    content.appendChild(subMenuContent)

    const wrapper = this.dom.div({
      className: "sub-menu",
    })
    wrapper.appendChild(this.triggerButton)
    wrapper.appendChild(content)

    this.triggerButton.addEventListener("click", () => {
      this.unselectAll()
      this.canvas.tool = CanvasTool.Erase
      this.triggerButton?.classList.add("active")
    })
    this.triggerButton.addEventListener("pointerdown", () => {
      content.classList.toggle("open")
    })

    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return wrapper
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    super.destroy()
  }

  update(): void {
    if (!this.element || !this.triggerButton) {
      return
    }

    const isActive = this.canvas.tool === CanvasTool.Erase
    this.triggerButton.classList.toggle("active", isActive)

    const currentSize = this.canvas.eraser.eraserWidth
    this.sizeButtons.forEach((btn, value) => {
      btn.classList.toggle("active", isActive && value === currentSize)
    })

    this.updateDisabled()
    this.updateVisible()
  }

  private unselectAll(): void {
    const menu = this.element?.closest(".ms-menu")
    menu?.querySelectorAll("*").forEach((e) => e.classList.remove("active"))
  }
}
