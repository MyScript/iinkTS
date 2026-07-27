import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

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
