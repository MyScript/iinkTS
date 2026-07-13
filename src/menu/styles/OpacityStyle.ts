import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuRange } from "@/menu/items"
import { CollapsibleWrapper, RangeMenuItem } from "@/menu/items"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"

/**
 * @group Menu
 * @remarks Opacity style menu
 */
export class OpacityStyle extends BaseMenuItem<HTMLDivElement> {
  private opacityItem?: RangeMenuItem

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-style") {
    const config = {
      type: "opacity" as const,
      id: `${idPrefix}-opacity`,
      label: "Opacity",
    }
    super(config, canvas)
  }

  createElement(): HTMLDivElement {
    const symbolsStyles = this.canvas.model.symbolsSelected.map((s) => s.style)
    const hasUniqOpacity = symbolsStyles.length && symbolsStyles.every((st) => st.opacity === symbolsStyles[0]?.opacity)
    const currentOpacity = Math.round(
      (hasUniqOpacity && symbolsStyles[0]?.opacity ? symbolsStyles[0]?.opacity : this.canvas.penStyle.opacity || 1) *
        100
    )

    const opacityConfig: TMenuRange = {
      type: "range",
      id: this.config.id,
      min: 1,
      max: 100,
      step: 1,
      initValue: currentOpacity,
      onChange: (value: number, canvas) => {
        canvas.penStyle = { opacity: value / 100 }
        if (canvas.model.symbolsSelected.length) {
          canvas.updateSymbolsStyle(
            canvas.model.symbolsSelected.map((s) => s.id),
            { opacity: value / 100 }
          )
        }
      },
    }

    this.opacityItem = new RangeMenuItem(opacityConfig, this.canvas)
    const opacityElement = this.opacityItem.getElement()
    const wrapper = new CollapsibleWrapper(opacityElement, "Opacity", this.config.id)
    return wrapper.getElement()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }

  destroy(): void {
    if (this.opacityItem) {
      this.opacityItem.destroy()
      this.opacityItem = undefined
    }
    super.destroy()
  }
}
