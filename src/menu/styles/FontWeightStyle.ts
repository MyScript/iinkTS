import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
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
    canvas: TInteractiveInkCanvas,
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
    super(config, canvas)
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
      getValue: (canvas) => canvas.configuration.fontStyle.weight,
      setValue: (canvas, value) => {
        canvas.configuration.fontStyle.weight = value as "auto" | "normal" | "bold"
        if (value !== "auto") {
          const textSymbols = canvas.model.symbolsSelected.filter((s) => isText(s))
          canvas.updateTextFontStyle(
            textSymbols.map((s) => s.id),
            {
              fontWeight: value as "normal" | "bold",
            }
          )
          canvas.selector.redrawSelectedGroup()
        }
      },
    }

    this.fontWeightItem = new ButtonListMenuItem(fontWeightConfig, this.canvas)
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
