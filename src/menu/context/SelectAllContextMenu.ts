import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu contextuel Select All - Sélectionne tous les symboles
 */
export class SelectAllContextMenu extends ButtonMenuItem {
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-context") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-select-all`,
      label: "Select all",
      action: async (editor: TInteractiveInkCanvas) => {
        await editor.selectAll()
      },
    }
    super(config, editor)
  }
}
