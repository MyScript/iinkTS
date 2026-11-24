import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuButton } from "../items/ButtonMenuItem"
import { ButtonMenuItem } from "../items/ButtonMenuItem"

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
