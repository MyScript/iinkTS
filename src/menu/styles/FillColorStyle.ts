import type { TInteractiveInkCanvas } from "@/canvas"
import { CanvasTool, CanvasWriteTool } from "@/manager"

import type { TMenuColorList } from "../items"
import { CollapsibleWrapper, ColorListMenuItem } from "../items"
import { BaseMenuItem } from "../items/BaseMenuItem"

/**
 * @group Menu
 * @remarks Fill color style menu
 */
export class FillColorStyle extends BaseMenuItem<HTMLDivElement> {
  private colorItem?: ColorListMenuItem
  private colors: string[]

  constructor(canvas: TInteractiveInkCanvas, colors: string[], idPrefix = "ms-menu-style") {
    const config = {
      type: "fillcolor" as const,
      id: `${idPrefix}-fill`,
      label: "Fill Color",
      visible: (canvas: TInteractiveInkCanvas) => {
        const writeShape = [
          CanvasWriteTool.Rectangle,
          CanvasWriteTool.Rhombus,
          CanvasWriteTool.Circle,
          CanvasWriteTool.Ellipse,
          CanvasWriteTool.Triangle,
          CanvasWriteTool.Parallelogram,
        ].includes(canvas.writer.tool)
        return CanvasTool.Select === canvas.tool || (CanvasTool.Write === canvas.tool && writeShape)
      },
    }
    super(config, canvas)
    this.colors = colors
  }

  createElement(): HTMLDivElement {
    const symbolsStyles = this.canvas.model.symbolsSelected.map((s) => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every((st) => st.color === symbolsStyles[0]?.color)
    const color =
      hasUniqColor && symbolsStyles[0].color ? symbolsStyles[0].color : (this.canvas.penStyle.color as string)

    const colorConfig: TMenuColorList = {
      type: "colorlist",
      id: `${this.config.id}-list`,
      fill: true,
      colors: this.colors,
      initValue: color,
      onChange: (fill, canvas) => {
        canvas.penStyle = { fill }
        canvas.updateSymbols(
          canvas.model.symbolsSelected.map((s) => s.id),
          { style: { fill } }
        )
      },
    }

    this.colorItem = new ColorListMenuItem(colorConfig, this.canvas)
    const colorElement = this.colorItem.getElement()
    const wrapper = new CollapsibleWrapper(colorElement, "Fill", this.config.id)
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
