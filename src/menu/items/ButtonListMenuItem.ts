import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a button list
 */
export type TMenuButtonList = TMenuItemBase & {
  type: "buttonlist"
  buttonType?: "square" | "round"
  options: Array<{ label?: string; icon?: string; value: string }>
  getValue: (canvas: TInteractiveInkCanvas) => string
  setValue: (canvas: TInteractiveInkCanvas, value: string) => void
}

/**
 * @group Menu
 * @remarks Class for button lists
 */
export class ButtonListMenuItem extends BaseMenuItem<HTMLDivElement> {
  declare protected config: TMenuButtonList

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: this.config.id,
      className: ["ms-menu-item", "list"],
    })

    if (this.config.label) {
      wrapper.appendChild(this.dom.span({ text: this.config.label }))
    }

    const currentValue = this.config.getValue(this.canvas)

    this.config.options.forEach((option) => {
      const button = this.dom.button({
        id: `${this.config.id}-${option.value}`,
        label: option.label || option.value,
        icon: option.icon,
        className: [this.config.buttonType || "", option.value === currentValue ? "active" : ""],
        onPointerUp: () => {
          this.logger.info(`${this.config.id}.change`, { value: option.value })
          this.config.setValue(this.canvas, option.value)

          wrapper.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"))
          button.classList.add("active")
        },
      })
      wrapper.appendChild(button)
    })

    if (typeof this.config.disabled === "function") {
      const isDisabled = this.config.disabled(this.canvas)
      wrapper.querySelectorAll("button").forEach((btn) => {
        btn.disabled = isDisabled
      })
    } else if (this.config.disabled) {
      wrapper.querySelectorAll("button").forEach((btn) => {
        btn.disabled = true
      })
    }

    return wrapper
  }

  update(): void {
    if (!this.element) {
      return
    }

    const currentValue = this.config.getValue(this.canvas)
    this.element.querySelectorAll("button").forEach((btn) => {
      const value = btn.id.replace(`${this.config.id}-`, "")
      if (value === currentValue) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })

    this.updateDisabled()
    this.updateVisible()
  }
}
