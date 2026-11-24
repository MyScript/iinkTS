import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuButton } from "../items/ButtonMenuItem"
import { ButtonMenuItem } from "../items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Convert - Convertit les symboles sélectionnés
 */
export class ConvertContextMenu extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-convert`,
      label: "Convert",
      action: (canvas: TInteractiveInkCanvas) => {
        const symbolsSelected = canvas.model.symbolsSelected
        canvas.convert(symbolsSelected)
      },
    }
    super(config, canvas)
  }
}
