import rectangleIcon from "@/assets/svg/rectangle.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuCheckbox } from "@/menu/items/CheckboxMenuItem"
import type { TMenuRange } from "@/menu/items/RangeMenuItem"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TOverlayActionItemsConfig = {
  showBlockOverlays?: boolean
  badgeSize?: boolean
  borderWidth?: boolean
  labelMaxChars?: boolean
  labelFontSize?: boolean
}
/** @group Menu */
export type TOverlayActionConfig = boolean | TOverlayActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action for overlay configuration (block overlays badge/border)
 */
export class OverlayMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TOverlayActionItemsConfig) {
    const enabled = (key: keyof TOverlayActionItemsConfig) => itemsConfig?.[key] !== false

    const items: (TMenuCheckbox | TMenuRange)[] = []

    if (enabled("showBlockOverlays")) {
      items.push({
        type: "checkbox",
        id: `${idPrefix}-overlay-show-block-overlays`,
        label: "Show block overlays",
        getValue: (canvas: TInteractiveInkCanvas) => canvas.overlays.getConfig().showBlockOverlays,
        setValue: (canvas: TInteractiveInkCanvas, value: boolean) => {
          canvas.overlays.updateConfig({
            showBlockOverlays: value,
          })
        },
      })
    }

    if (enabled("badgeSize")) {
      items.push({
        type: "range",
        id: `${idPrefix}-overlay-badge-size`,
        label: "Badge size",
        min: 10,
        max: 40,
        step: 2,
        initValue: canvas.overlays.getConfig().badgeSize,
        unit: "px",
        onChange: (value: number, canvas: TInteractiveInkCanvas) => {
          canvas.overlays.updateConfig({
            badgeSize: value,
          })
        },
      })
    }

    if (enabled("borderWidth")) {
      items.push({
        type: "range",
        id: `${idPrefix}-overlay-border-width`,
        label: "Border width",
        min: 1,
        max: 8,
        step: 1,
        initValue: canvas.overlays.getConfig().borderWidth,
        unit: "px",
        onChange: (value: number, canvas: TInteractiveInkCanvas) => {
          canvas.overlays.updateConfig({
            borderWidth: value,
          })
        },
      })
    }

    if (enabled("labelMaxChars")) {
      items.push({
        type: "range",
        id: `${idPrefix}-overlay-label-max-chars`,
        label: "Label max chars",
        min: 5,
        max: 40,
        step: 1,
        initValue: canvas.overlays.getConfig().labelMaxChars,
        unit: "chars",
        onChange: (value: number, canvas: TInteractiveInkCanvas) => {
          canvas.overlays.updateConfig({
            labelMaxChars: value,
          })
        },
      })
    }

    if (enabled("labelFontSize")) {
      items.push({
        type: "range",
        id: `${idPrefix}-overlay-label-font-size`,
        label: "Label font size",
        min: 8,
        max: 20,
        step: 1,
        initValue: canvas.overlays.getConfig().labelFontSize,
        unit: "px",
        onChange: (value: number, canvas: TInteractiveInkCanvas) => {
          canvas.overlays.updateConfig({
            labelFontSize: value,
          })
        },
      })
    }

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-overlay`,
      label: "Overlay",
      menuTitle: "Overlay",
      icon: rectangleIcon,
      position: "right-top",
      items,
    }

    super(config, canvas)
  }
}
