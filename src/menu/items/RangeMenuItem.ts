import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a range input menu item
 */
export type TMenuRange = TMenuItemBase & {
  type: "range"
  min: number
  max: number
  unit?: string
  step: number
  initValue?: number
  onChange: (value: number, canvas: TInteractiveInkCanvas) => void
}

/**
 * @group Menu
 * @remarks Class for range input menu items (slider)
 */
export class RangeMenuItem extends BaseMenuItem<HTMLDivElement> {
  declare protected config: TMenuRange
  private currentValue: number
  private input?: HTMLInputElement
  private output?: HTMLOutputElement

  constructor(config: TMenuRange, canvas: TInteractiveInkCanvas) {
    super(config, canvas)
    this.currentValue = config.initValue ?? config.min
  }

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: `${this.config.id}-wrapper`,
      className: ["ms-menu-item", "range"],
    })

    this.input = this.dom.range({
      id: `${this.config.id}-input`,
      min: this.config.min,
      max: this.config.max,
      step: this.config.step,
      value: this.currentValue,
      name: this.config.label,
    })

    wrapper.appendChild(this.input)

    this.output = this.dom.output({
      text: this.currentValue !== undefined ? `${this.currentValue}${this.config.unit ?? "%"}` : "-",
      htmlFor: this.config.label,
    })
    wrapper.appendChild(this.output)

    if (this.config.label) {
      const label = this.dom.label({
        text: this.config.label,
        htmlFor: `${this.config.id}-input`,
      })
      wrapper.insertBefore(label, this.input)
    }

    this.input.addEventListener("input", (evt) => {
      const value = parseInt((evt.target as HTMLInputElement).value)
      this.currentValue = value
      if (this.output) {
        this.output.innerHTML = `${value}${this.config.unit ?? "%"}`
      }
      this.config.onChange(value, this.canvas)
    })

    return wrapper
  }

  getValue(): number {
    return this.currentValue
  }

  setValue(value: number): void {
    this.currentValue = value
    if (this.input) {
      this.input.value = value.toString()
    }
    if (this.output) {
      this.output.innerHTML = `${value}${this.config.unit ?? "%"}`
    }
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
