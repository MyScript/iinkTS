import trashIcon from "@/assets/svg/trash.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import { ButtonMenuItem } from "@/menu/items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu action Clear
 */
export class ClearMenuAction extends ButtonMenuItem {
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-clear`,
      label: "Clear",
      icon: trashIcon,
      action: (editor) => editor.clear(),
      disabled: (editor) => editor.history.context.empty,
    }
    super(config, editor)
  }
}
