import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

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

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-overlay`,
      label: "Overlay",
      menuTitle: "Overlay",
      position: "right-top",
      items: [],
    }

    if (enabled("showBlockOverlays")) {
      config.items.push({
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
      config.items.push({
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
      config.items.push({
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
      config.items.push({
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
      config.items.push({
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

    super(config, canvas)
  }
}
