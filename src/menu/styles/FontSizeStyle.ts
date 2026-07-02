import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButtonList } from "@/menu/items"
import { ButtonListMenuItem, CollapsibleWrapper } from "@/menu/items"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { isText } from "@/symbol"

/**
 * @group Menu
 * @remarks Font size style menu
 */
export class FontSizeStyle extends BaseMenuItem<HTMLDivElement> {
  private fontSizeItem?: ButtonListMenuItem
  private fontSizeList: {
    label: string
    value: "auto" | number
  }[]
  private rowHeight: number

  constructor(
    editor: TInteractiveInkEditor,
    fontSizeList: {
      label: string
      value: "auto" | number
    }[],
    rowHeight: number,
    idPrefix = "ms-menu-style"
  ) {
    const config = {
      type: "fontsize" as const,
      id: `${idPrefix}-font-size`,
      label: "Font Size",
    }
    super(config, editor)
    this.fontSizeList = fontSizeList
    this.rowHeight = rowHeight
  }

  createElement(): HTMLDivElement {
    const fontSizeConfig: TMenuButtonList = {
      type: "buttonlist",
      id: this.config.id,
      options: this.fontSizeList.map((f) => ({
        label: f.label,
        value: f.value.toString(),
      })),
      getValue: (editor) => editor.configuration.fontStyle.size.toString(),
      setValue: (editor, value) => {
        if (value === "auto") {
          editor.configuration.fontStyle.size = "auto"
        } else {
          const fontSize = parseFloat(value)
          editor.configuration.fontStyle.size = fontSize
          const textSymbols = editor.model.symbolsSelected.filter((s) => isText(s))
          editor.updateTextFontStyle(
            textSymbols.map((s) => s.id),
            {
              fontSize: fontSize * this.rowHeight,
            }
          )
          editor.selector.redrawSelectedGroup()
        }
      },
    }

    this.fontSizeItem = new ButtonListMenuItem(fontSizeConfig, this.editor)
    const fontSizeElement = this.fontSizeItem.getElement()
    const wrapper = new CollapsibleWrapper(fontSizeElement, "Font size", this.config.id)
    return wrapper.getElement()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    if (this.fontSizeItem) {
      this.fontSizeItem.destroy()
      this.fontSizeItem = undefined
    }
    super.destroy()
  }
}
