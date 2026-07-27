import translateIcon from "@/assets/svg/translate.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu action Convert
 */
export class ConvertMenuAction extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-convert`,
      label: "Convert",
      icon: translateIcon,
      action: (canvas) => canvas.convert(),
      disabled: (canvas) => !canvas.extractStrokesFromSymbols(canvas.model.symbols).length,
    }
    super(config, canvas)
  }
}
