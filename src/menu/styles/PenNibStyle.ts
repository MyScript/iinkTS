import ballpointIcon from "@/assets/svg/nib-ballpoint.svg"
import brushIcon from "@/assets/svg/nib-brush.svg"
import fountainIcon from "@/assets/svg/nib-fountain.svg"
import pencilIcon from "@/assets/svg/nib-pencil.svg"
import type { TInteractiveInkCanvas } from "@/canvas"
import { CanvasTool } from "@/manager"
import { DEFAULT_PEN_NIB, isPenNib, PEN_NIBS } from "@/style"

import type { TMenuButtonList } from "../items"
import { ButtonListMenuItem, CollapsibleWrapper } from "../items"
import { BaseMenuItem } from "../items/BaseMenuItem"

const icons: { [key in keyof typeof PEN_NIBS]: string } = {
  ballpoint: ballpointIcon as string,
  brush: brushIcon as string,
  fountain: fountainIcon as string,
  pencil: pencilIcon as string,
}
/** Every nib, in the order the write tool offers them. */
const NIB_OPTIONS = (Object.keys(PEN_NIBS) as (keyof typeof PEN_NIBS)[]).map((nib) => ({
  icon: icons[nib],
  // label: nib.charAt(0).toUpperCase() + nib.slice(1),
  value: nib,
}))

/**
 * @group Menu
 * @remarks Nib style menu — picks the instrument, for the pen and for what is already selected
 *
 * The nib lives on a stroke's style, so changing it here rewrites the selected strokes and they
 * redraw with the new instrument. Without this the nib could only ever be chosen before writing.
 */
export class PenNibStyle extends BaseMenuItem<HTMLDivElement> {
  private nibItem?: ButtonListMenuItem

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-style") {
    super(
      {
        type: "pen" as const,
        id: `${idPrefix}-pen`,
        label: "Pen",
        visible: (canvas: TInteractiveInkCanvas) => [CanvasTool.Write, CanvasTool.Select].includes(canvas.tool),
      },
      canvas
    )
  }

  createElement(): HTMLDivElement {
    const config: TMenuButtonList = {
      type: "buttonlist",
      id: this.config.id,
      buttonType: "square",
      options: NIB_OPTIONS,
      getValue: (canvas) => {
        // What the selection says, when it speaks with one voice; otherwise what the pen carries.
        const styles = canvas.model.symbolsSelected.map((s) => s.style)
        const shared = styles.length > 0 && styles.every((style) => style.pen === styles[0].pen)
        const nib = shared ? styles[0].pen : canvas.penStyle.pen
        return isPenNib(nib) ? nib : DEFAULT_PEN_NIB
      },
      setValue: (canvas, value) => {
        if (!isPenNib(value)) {
          return
        }
        canvas.penStyle = { pen: value }
        if (canvas.model.symbolsSelected.length) {
          canvas.updateSymbols(
            canvas.model.symbolsSelected.map((s) => s.id),
            { style: { pen: value } }
          )
          canvas.selector.redrawSelectedGroup()
        }
      },
    }

    this.nibItem = new ButtonListMenuItem(config, this.canvas)
    const wrapper = new CollapsibleWrapper(this.nibItem.getElement(), "Pen", this.config.id)
    return wrapper.getElement()
  }

  update(): void {
    this.updateDisabled()
    this.nibItem?.update()
    this.updateVisible()
  }

  destroy(): void {
    if (this.nibItem) {
      this.nibItem.destroy()
      this.nibItem = undefined
    }
    super.destroy()
  }
}
