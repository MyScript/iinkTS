import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TGenericMenuItem } from "@/menu/items/BaseMenuItem"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import type { TText } from "@/symbol"
import { isText } from "@/symbol"
import { createUUID } from "@/utils"

/**
 * @group Menu
 * @remarks Menu contextuel Edit - Édite le texte sélectionné
 */
export class EditContextMenu extends BaseMenuItem<HTMLElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  declare protected config: TGenericMenuItem
  editInput?: HTMLInputElement
  editSaveBtn?: HTMLButtonElement

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TGenericMenuItem = {
      type: "custom",
      id: `${idPrefix}-edit`,
      label: "Edit",
    }
    super(config, canvas)
  }

  createElement(): HTMLElement {
    const trigger = this.dom.button({
      id: `${this.config.id}-trigger`,
    })
    const label = this.dom.span({ text: "Edit" })
    trigger.appendChild(label)
    const icon = this.dom.span({
      html: ArrowDown,
    })
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    trigger.appendChild(icon)

    const subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    this.editInput = this.dom.textInput({})
    subMenuWrapper.appendChild(this.editInput)

    this.editSaveBtn = this.dom.button({
      label: "Save",
    })
    subMenuWrapper.appendChild(this.editSaveBtn)

    this.editSaveBtn.addEventListener("pointerdown", async (e) => {
      e.stopPropagation()
      const textSymbol = this.canvas.model.symbolsSelected.find((s) => isText(s)) as TText
      if (textSymbol) {
        const firstChar = textSymbol.chars[0]
        textSymbol.chars = []
        for (let i = 0; i < this.editInput!.value.length; i++) {
          textSymbol.chars.push({
            label: this.editInput!.value.charAt(i),
            id: createUUID(),
            color: firstChar.color,
            fontSize: firstChar.fontSize,
            fontWeight: firstChar.fontWeight,
            bounds: firstChar.bounds,
          })
        }
        await this.canvas.updateSymbol(textSymbol)
        this.canvas.selector.drawSelectedGroup([textSymbol])
      }
    })

    const wrapper = this.dom.div({
      className: "sub-menu",
    })
    wrapper.appendChild(trigger)

    const content = this.dom.div({
      className: ["sub-menu-content", "right"],
    })
    content.appendChild(subMenuWrapper)
    wrapper.appendChild(content)

    // Event listeners
    trigger.addEventListener("pointerdown", () => content.classList.toggle("open"))
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
    this.updateDisabled()
    this.updateVisible()
  }
}
