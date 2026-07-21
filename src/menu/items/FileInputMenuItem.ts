import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"

import type { TMenuItemBase } from "./BaseMenuItem"
import { BaseMenuItem } from "./BaseMenuItem"

/**
 * @group Menu
 * @remarks Configuration for a file input with a validation button
 */
export type TMenuFileInput = TMenuItemBase & {
  type: "fileinput"
  accept?: string
  multiple?: boolean
  buttonLabel?: string
  action: (canvas: TInteractiveInkCanvas, files: FileList) => void | Promise<void>
}

/**
 * @group Menu
 * @remarks Menu item for selecting and validating a file
 */
export class FileInputMenuItem extends BaseMenuItem<HTMLDivElement> {
  declare protected config: TMenuFileInput
  private inputElement!: HTMLInputElement
  private buttonElement!: HTMLButtonElement

  createElement(): HTMLDivElement {
    const wrapper = this.dom.div({
      id: this.config.id,
      className: "ms-menu-file-input ms-menu-column ms-gap-sm",
    })

    this.inputElement = this.dom.fileInput({
      id: `${this.config.id}-input`,
      accept: this.config.accept,
      multiple: this.config.multiple,
    })
    this.inputElement.addEventListener("change", () => {
      this.buttonElement.disabled = !this.inputElement.files?.length
    })
    wrapper.appendChild(this.inputElement)

    this.buttonElement = this.dom.button({
      label: this.config.buttonLabel || this.config.label || "Upload",
      variant: "primary",
      className: "full-width",
    })
    this.buttonElement.disabled = true
    this.buttonElement.addEventListener("pointerup", async (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (this.inputElement.files?.length) {
        await this.config.action(this.canvas, this.inputElement.files)
        this.inputElement.value = ""
        this.buttonElement.disabled = true
        wrapper.dispatchEvent(new CustomEvent("ms-menu-close", { bubbles: true }))
      }
    })
    wrapper.appendChild(this.buttonElement)

    return wrapper
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}
