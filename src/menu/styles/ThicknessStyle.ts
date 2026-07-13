import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
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
    canvas: TInteractiveInkCanvas,
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
    super(config, canvas)
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
      getValue: (canvas) => {
        const symbolsStyles = canvas.model.symbolsSelected.map((s) => s.style)
        const hasUniqWidth = symbolsStyles.length && symbolsStyles.every((st) => st.width === symbolsStyles[0].width)
        const width = hasUniqWidth ? symbolsStyles[0].width : canvas.penStyle.width
        return width?.toString() || "1"
      },
      setValue: (canvas, value) => {
        const numValue = parseInt(value)
        canvas.penStyle = { width: numValue }
        if (canvas.model.symbolsSelected.length) {
          canvas.updateSymbolsStyle(
            canvas.model.symbolsSelected.map((s) => s.id),
            { width: numValue }
          )
          canvas.selector.redrawSelectedGroup()
        }
      },
    }

    this.thicknessItem = new ButtonListMenuItem(thicknessConfig, this.canvas)
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
