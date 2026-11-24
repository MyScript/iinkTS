import type { TInteractiveInkCanvas } from "@/canvas"
import { CanvasTool } from "@/manager"
import { isText } from "@/symbol"

import type { TMenuButtonList } from "../items"
import { ButtonListMenuItem, CollapsibleWrapper } from "../items"
import { BaseMenuItem } from "../items/BaseMenuItem"
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
    canvas: TInteractiveInkCanvas,
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
      visible: (canvas: TInteractiveInkCanvas) => [CanvasTool.Write, CanvasTool.Select].includes(canvas.tool),
    }
    super(config, canvas)
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
      getValue: (canvas) => canvas.configuration.fontStyle.size.toString(),
      setValue: (canvas, value) => {
        if (value === "auto") {
          canvas.configuration.fontStyle.size = "auto"
        } else {
          const fontSize = parseFloat(value)
          canvas.configuration.fontStyle.size = fontSize
          const textSymbols = canvas.model.symbolsSelected.filter((s) => isText(s))
          canvas.updateSymbols(
            textSymbols.map((s) => s.id),
            { font: { size: fontSize * this.rowHeight } }
          )
          canvas.selector.redrawSelectedGroup()
        }
      },
    }

    this.fontSizeItem = new ButtonListMenuItem(fontSizeConfig, this.canvas)
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
