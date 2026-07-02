import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButtonList } from "@/menu/items"
import { ButtonListMenuItem, CollapsibleWrapper } from "@/menu/items"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { isText } from "@/symbol"

/**
 * @group Menu
 * @remarks Font weight style menu
 */
export class FontWeightStyle extends BaseMenuItem<HTMLDivElement> {
  private fontWeightItem?: ButtonListMenuItem
  private fontWeightList: {
    label: string
    value: "auto" | "normal" | "bold"
  }[]

  constructor(
    editor: TInteractiveInkEditor,
    fontWeightList: {
      label: string
      value: "auto" | "normal" | "bold"
    }[],
    idPrefix = "ms-menu-style"
  ) {
    const config = {
      type: "fontweight" as const,
      id: `${idPrefix}-font-weight`,
      label: "Font Weight",
    }
    super(config, editor)
    this.fontWeightList = fontWeightList
  }

  createElement(): HTMLDivElement {
    const fontWeightConfig: TMenuButtonList = {
      type: "buttonlist",
      id: this.config.id,
      options: this.fontWeightList.map((f) => ({
        label: f.label,
        value: f.value,
      })),
      getValue: (editor) => editor.configuration.fontStyle.weight,
      setValue: (editor, value) => {
        editor.configuration.fontStyle.weight = value as "auto" | "normal" | "bold"
        if (value !== "auto") {
          const textSymbols = editor.model.symbolsSelected.filter((s) => isText(s))
          editor.updateTextFontStyle(
            textSymbols.map((s) => s.id),
            {
              fontWeight: value as "normal" | "bold",
            }
          )
          editor.selector.redrawSelectedGroup()
        }
      },
    }

    this.fontWeightItem = new ButtonListMenuItem(fontWeightConfig, this.editor)
    const fontWeightElement = this.fontWeightItem.getElement()
    const wrapper = new CollapsibleWrapper(fontWeightElement, "Font weight", this.config.id)
    return wrapper.getElement()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    if (this.fontWeightItem) {
      this.fontWeightItem.destroy()
      this.fontWeightItem = undefined
    }
    super.destroy()
  }
}
