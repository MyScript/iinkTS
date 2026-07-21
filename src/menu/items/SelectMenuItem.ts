import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a select/dropdown menu item
 */
export type TMenuSelect = TMenuItemBase & {
  type: "select"
  options: Array<{ label: string; value: string }>
  getValue: (canvas: TInteractiveInkCanvas) => string
  setValue: (canvas: TInteractiveInkCanvas, value: string) => void
}

/**
 * @group Menu
 * @remarks Class for select/dropdown menu items
 */
export class SelectMenuItem extends BaseMenuItem<HTMLDivElement> {
  declare protected config: TMenuSelect

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: this.config.id,
      className: ["ms-menu-item", "select"],
    })

    if (this.config.label) {
      wrapper.appendChild(this.dom.span({ text: this.config.label }))
    }

    const isDisabled =
      typeof this.config.disabled === "function" ? this.config.disabled(this.canvas) : (this.config.disabled ?? false)

    const currentValue = this.config.getValue(this.canvas)

    const select = this.dom.select({
      id: `${this.config.id}-input`,
      options: this.config.options.map((o) => ({
        value: o.value,
        label: o.label,
        selected: o.value === currentValue,
      })),
      defaultValue: currentValue,
      disabled: isDisabled,
      onChange: (value) => {
        this.logger.info(`${this.config.id}.change`, { value })
        this.config.setValue(this.canvas, value)
      },
    })

    wrapper.appendChild(select)

    return wrapper
  }

  update(): void {
    if (!this.element) {
      return
    }

    const select = this.element.querySelector("select") as HTMLSelectElement
    if (select) {
      select.value = this.config.getValue(this.canvas)
    }

    this.updateDisabled()
    this.updateVisible()
  }
}
