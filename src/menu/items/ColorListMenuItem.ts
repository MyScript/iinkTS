import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a color list menu item
 */
export type TMenuColorList = TMenuItemBase & {
  type: "colorlist"
  colors: string[]
  fill: boolean
  initValue?: string
  onChange: (color: string, canvas: TInteractiveInkCanvas) => void
}

/**
 * @group Menu
 * @remarks Class for color list menu items
 */
export class ColorListMenuItem extends BaseMenuItem<HTMLDivElement> {
  declare protected config: TMenuColorList
  private currentValue: string

  constructor(config: TMenuColorList, canvas: TInteractiveInkCanvas) {
    super(config, canvas)
    this.currentValue = config.initValue || config.colors[0] || "#000000"
  }

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: this.config.id,
      className: ["ms-menu-row", "list"],
    })

    this.config.colors.forEach((color) => {
      const colorId = color.replace("#", "")
      const btn = this.dom.button({
        className: "square",
      })
      btn.id = `${this.config.id}-${colorId}`

      const colorEl = this.dom.div({
        className: ["color"],
      })

      if (this.config.fill) {
        colorEl.style.setProperty("background-color", color)
        colorEl.style.setProperty("border", "1px solid lightgrey")
      } else {
        colorEl.style.setProperty("background-color", "transparent")
        colorEl.style.setProperty("border", `3px solid ${color}`)
      }

      if (color === "#ffffff") {
        colorEl.style.setProperty("border", "1px solid black")
      }

      if (color === "transparent") {
        colorEl.style.setProperty(
          "background-image",
          "linear-gradient(45deg, #AAA 10%, transparent 20%, #AAA 30%, transparent 40%, #AAA 50%, transparent 60%, #AAA 70%, transparent 80%, #AAA 90%, transparent 100%)"
        )
      }

      if (this.currentValue === color) {
        btn.classList.add("active")
      }

      btn.appendChild(colorEl)
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.currentValue = color
        this.config.onChange(color, this.canvas)
        wrapper.querySelectorAll("button").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
      })

      wrapper.appendChild(btn)
    })

    return wrapper
  }

  getValue(): string {
    return this.currentValue
  }

  setValue(color: string): void {
    if (!this.element) {
      return
    }

    this.currentValue = color
    const buttons = this.element.querySelectorAll("button")
    buttons.forEach((btn) => {
      const colorId = color.replace("#", "")
      if (btn.id === `${this.config.id}-${colorId}`) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
