import trashIcon from "@/assets/svg/trash.svg"
import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuButton } from "../items/ButtonMenuItem"
import { ButtonMenuItem } from "../items/ButtonMenuItem"

/**
 * @group Menu
 * @remarks Menu action Clear
 */
export class ClearMenuAction extends ButtonMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuButton = {
      type: "button",
      id: `${idPrefix}-clear`,
      label: "Clear",
      icon: trashIcon,
      action: (canvas) => canvas.clear(),
      disabled: (canvas) => canvas.history.context.empty,
    }
    super(config, canvas)
  }
}
