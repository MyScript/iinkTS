import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuButtonList } from "@/menu/items"
import { ButtonListMenuItem, CollapsibleWrapper } from "@/menu/items"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"

/**
 * @group Menu
 * @remarks Thickness style menu
 */
export class ThicknessStyle extends BaseMenuItem<HTMLDivElement> {
  private thicknessItem?: ButtonListMenuItem
  private thicknessList: {
    label: string
    value: number
  }[]

  constructor(
    editor: TInteractiveInkEditor,
    thicknessList: {
      label: string
      value: number
    }[],
    idPrefix = "ms-menu-style"
  ) {
    const config = {
      type: "thickness" as const,
      id: `${idPrefix}-thickness`,
      label: "Thickness",
    }
    super(config, editor)
    this.thicknessList = thicknessList
  }

  createElement(): HTMLDivElement {
    const thicknessConfig: TMenuButtonList = {
      type: "buttonlist",
      id: this.config.id,
      buttonType: "square",
      options: this.thicknessList.map((t) => ({
        label: t.label,
        value: t.value.toString(),
      })),
      getValue: (editor) => {
        const symbolsStyles = editor.model.symbolsSelected.map((s) => s.style)
        const hasUniqWidth = symbolsStyles.length && symbolsStyles.every((st) => st.width === symbolsStyles[0].width)
        const width = hasUniqWidth ? symbolsStyles[0].width : editor.penStyle.width
        return width?.toString() || "1"
      },
      setValue: (editor, value) => {
        const numValue = parseInt(value)
        editor.penStyle = { width: numValue }
        if (editor.model.symbolsSelected.length) {
          editor.updateSymbolsStyle(
            editor.model.symbolsSelected.map((s) => s.id),
            { width: numValue }
          )
          editor.selector.redrawSelectedGroup()
        }
      },
    }

    this.thicknessItem = new ButtonListMenuItem(thicknessConfig, this.editor)
    const thicknessElement = this.thicknessItem.getElement()
    const wrapper = new CollapsibleWrapper(thicknessElement, "Thickness", this.config.id)
    return wrapper.getElement()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    if (this.thicknessItem) {
      this.thicknessItem.destroy()
      this.thicknessItem = undefined
    }
    super.destroy()
  }
}
