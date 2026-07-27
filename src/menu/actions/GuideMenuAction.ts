import guideIcon from "@/assets/svg/orthogonal-view.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TGuideActionItemsConfig = {
  enable?: boolean
  type?: boolean
  size?: boolean
}
/** @group Menu */
export type TGuideActionConfig = boolean | TGuideActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action Guide - Configuration des guides
 */
export class GuideMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TGuideActionItemsConfig) {
    const enabled = (key: keyof TGuideActionItemsConfig) => itemsConfig?.[key] !== false

    const guideGaps = [
      { label: "S", value: "25" },
      { label: "M", value: "50" },
      { label: "L", value: "100" },
      { label: "XL", value: "150" },
    ]

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-guide`,
      label: "Guide",
      menuTitle: "Guide",
      icon: guideIcon,
      position: "right-top",
      items: [],
    }

    if (enabled("enable")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-guide-enable`,
        label: "Show guide",
        getValue: (canvas) => canvas.configuration.rendering.guides.enable,
        setValue: (canvas, value) => {
          canvas.configuration.rendering.guides.enable = value
          canvas.renderingConfiguration = canvas.configuration.rendering
        },
      })
    }

    if (enabled("type")) {
      config.items.push({
        type: "select",
        id: `${idPrefix}-guide-type`,
        label: "Guide style",
        options: [
          { label: "Line", value: "line" },
          { label: "Grid", value: "grid" },
          { label: "Point", value: "point" },
        ],
        getValue: (canvas) => canvas.configuration.rendering.guides.type,
        setValue: (canvas, value) => {
          canvas.configuration.rendering.guides.type = value as "line" | "grid" | "point"
          canvas.renderingConfiguration = canvas.configuration.rendering
        },
      })
    }

    if (enabled("size")) {
      config.items.push({
        type: "buttonlist",
        id: `${idPrefix}-guide-size`,
        label: "Guide size",
        buttonType: "square",
        options: guideGaps,
        getValue: (canvas) => canvas.configuration.rendering.guides.gap.toString(),
        setValue: (canvas, value) => {
          canvas.configuration.rendering.guides.gap = +value
          canvas.renderingConfiguration = canvas.configuration.rendering
        },
      })
    }

    super(config, canvas)
  }
}
