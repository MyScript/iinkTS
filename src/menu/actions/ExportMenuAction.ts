import downloadIcon from "@/assets/svg/download.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TExportActionItemsConfig = {
  json?: boolean
  svg?: boolean
  png?: boolean
  text?: boolean
}
/** @group Menu */
export type TExportActionConfig = boolean | TExportActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action Export - Export en différents formats
 */
export class ExportMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TExportActionItemsConfig) {
    const enabled = (key: keyof TExportActionItemsConfig) => itemsConfig?.[key] !== false

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-export`,
      label: "Export",
      menuTitle: "Export",
      icon: downloadIcon,
      position: "right-top",
      items: [],
    }

    if (enabled("json")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-json`,
        label: "JSON",
        action: (e) => e.downloadAsJson(),
      })
    }
    if (enabled("svg")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-svg`,
        label: "SVG",
        action: (e) => e.downloadAsSVG(),
      })
    }
    if (enabled("png")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-png`,
        label: "PNG",
        action: (e) => e.downloadAsPNG(),
      })
    }
    if (enabled("text")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-text`,
        label: "Text",
        action: (e) => e.downloadAsText(),
      })
    }

    super(config, canvas)
  }
}
