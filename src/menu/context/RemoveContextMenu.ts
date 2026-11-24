import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuButton } from "../items/ButtonMenuItem"
import { ButtonMenuItem } from "../items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Remove - Supprime les symboles sélectionnés
 */
export class RemoveContextMenu extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-remove`,
      label: "Remove",
      action: async (canvas: TInteractiveInkCanvas) => {
        const symbolsSelected = canvas.model.symbolsSelected
        canvas.selector.removeSelectedGroup()
        await canvas.removeSymbols(symbolsSelected.map((s) => s.id))
      },
    }
    super(config, canvas)
  }
}
