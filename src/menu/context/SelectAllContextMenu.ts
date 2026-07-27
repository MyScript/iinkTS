import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Select All - selects all symbols
 */
export class SelectAllContextMenu extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-select-all`,
      label: "Select all",
      action: async (canvas: TInteractiveInkCanvas) => {
        await canvas.selectAll()
      },
    }
    super(config, canvas)
  }
}
