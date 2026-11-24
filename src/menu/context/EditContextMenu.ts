import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import type { TInteractiveInkCanvas } from "@/canvas"
import { createUUID } from "@/core"
import { isText } from "@/symbol"

import type { TGenericMenuItem } from "../items/BaseMenuItem"
import { BaseMenuItem } from "../items/BaseMenuItem"
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
      const selectedText = this.canvas.model.symbolsSelected.find((s) => isText(s))
      if (selectedText) {
        const label = this.editInput!.value
        try {
          // The patch rewrites the chars of a draft; the canvas re-measures and commits it
          const updated = await this.canvas.updateSymbol(selectedText.id, (draft) => {
            if (!isText(draft)) {
              return
            }
            const firstChar = draft.chars[0]
            draft.chars = []
            for (let i = 0; i < label.length; i++) {
              draft.chars.push({
                label: label.charAt(i),
                id: createUUID(),
                color: firstChar.color,
                fontSize: firstChar.fontSize,
                fontWeight: firstChar.fontWeight,
                bounds: firstChar.bounds,
              })
            }
          })
          if (updated) {
            this.canvas.selector.drawSelectedGroup([updated])
          }
        } catch (error) {
          // Reported rather than swallowed: the edit would otherwise end with no redraw and no feedback
          this.canvas.manageError(error as Error)
        }
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
