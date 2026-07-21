import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuColorList } from "@/menu/items"
import { CollapsibleWrapper, ColorListMenuItem } from "@/menu/items"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"

/**
 * @group Menu
 * @remarks Stroke color style menu
 */
export class StrokeColorStyle extends BaseMenuItem<HTMLDivElement> {
  private colorItem?: ColorListMenuItem
  private colors: string[]

  constructor(canvas: TInteractiveInkCanvas, colors: string[], idPrefix = "ms-menu-style") {
    const config = {
      type: "strokecolor" as const,
      id: `${idPrefix}-color`,
      label: "Stroke Color",
    }
    super(config, canvas)
    this.colors = colors
  }

  createElement(): HTMLDivElement {
    const symbolsStyles = this.canvas.model.symbolsSelected.map((s) => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every((st) => st.color === symbolsStyles[0]?.color)
    const color =
      hasUniqColor && symbolsStyles[0]?.color ? symbolsStyles[0]?.color : (this.canvas.penStyle.color as string)

    const colorConfig: TMenuColorList = {
      type: "colorlist",
      id: `${this.config.id}-list`,
      label: "Colors",
      fill: false,
      colors: this.colors,
      initValue: color,
      onChange: (color, canvas) => {
        canvas.penStyle = { color }
        canvas.updateSymbolsStyle(
          canvas.model.symbolsSelected.map((s) => s.id),
          { color }
        )
      },
    }

    this.colorItem = new ColorListMenuItem(colorConfig, this.canvas)
    const colorElement = this.colorItem.getElement()
    const wrapper = new CollapsibleWrapper(colorElement, "Colors", this.config.id)
    return wrapper.getElement()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    if (this.colorItem) {
      this.colorItem.destroy()
      this.colorItem = undefined
    }
    super.destroy()
  }
}
