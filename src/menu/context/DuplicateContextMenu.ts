import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"

import type { TMenuButton } from "../items"
import { ButtonMenuItem } from "../items"

/**
 * @group Menu
 * @remarks Menu contextuel Duplicate - Duplique les symboles sélectionnés
 */
export class DuplicateContextMenu extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-duplicate`,
      label: "Duplicate",
      action: async () => {
        const symbolsToDuplicate = this.canvas.model.symbolsSelected.slice()
        await this.canvas.duplicate(symbolsToDuplicate)
      },
    }
    super(config, canvas)
  }
}
