import snapIcon from "@/assets/svg/arrow-to-dot.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TSnapActionItemsConfig = {
  guide?: boolean
  element?: boolean
  angle?: boolean
}
/** @group Menu */
export type TSnapActionConfig = boolean | TSnapActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action Snap - Configuration du snap
 */
export class SnapMenuAction extends SubMenuItem {
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TSnapActionItemsConfig) {
    const enabled = (key: keyof TSnapActionItemsConfig) => itemsConfig?.[key] !== false

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-snap`,
      label: "Snap",
      menuTitle: "Snap",
      icon: snapIcon,
      position: "right-top",
      items: [],
    }

    if (enabled("guide")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-snap-to-guide`,
        label: "Snap to guide",
        getValue: (editor) => editor.snaps.snapConfiguration.guide,
        setValue: (editor, value) => {
          editor.snaps.snapConfiguration.guide = value
        },
      })
    }

    if (enabled("element")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-snap-to-element`,
        label: "Snap to element",
        getValue: (editor) => editor.snaps.snapConfiguration.symbol,
        setValue: (editor, value) => {
          editor.snaps.snapConfiguration.symbol = value
        },
      })
    }

    if (enabled("angle")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-snap-angle`,
        label: "Snap angle",
        options: [
          { label: "None", value: "0" },
          { label: "10°", value: "10" },
          { label: "30°", value: "30" },
          { label: "45°", value: "45" },
          { label: "90°", value: "90" },
          { label: "180°", value: "180" },
        ],
        getValue: (editor) => editor.snaps.snapConfiguration.angle.toString(),
        setValue: (editor, angle) => {
          editor.snaps.snapConfiguration.angle = +angle
        },
      })
    }

    super(config, editor)
  }
}
