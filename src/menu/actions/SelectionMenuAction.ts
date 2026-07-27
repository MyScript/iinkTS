import frameSelectIcon from "@/assets/svg/frame-select.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMenuSelect } from "@/menu/items/SelectMenuItem"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TSelectionActionItemsConfig = {
  text?: boolean
  math?: boolean
  shape?: boolean
}
/** @group Menu */
export type TSelectionActionConfig = boolean | TSelectionActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action for configuring selection granularity (text, math and shape levels)
 */
export class SelectionMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TSelectionActionItemsConfig) {
    const enabled = (key: keyof TSelectionActionItemsConfig) => itemsConfig?.[key] !== false

    const items: TMenuSelect[] = []

    if (enabled("text") && canvas.configuration.recognition["raw-content"].recognition?.types.includes("text")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-text-level`,
        label: "Text selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Word", value: "word" },
          { label: "Character", value: "char" },
        ],
        getValue: (canvas: TInteractiveInkCanvas) => canvas.configuration.textSelectionLevel,
        setValue: (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.configuration.textSelectionLevel = value as "element" | "word" | "char"
        },
      })
    }

    if (enabled("math") && canvas.configuration.recognition["raw-content"].recognition?.types.includes("math")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-math-level`,
        label: "Math selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Operand", value: "operand" },
        ],
        getValue: (canvas: TInteractiveInkCanvas) => canvas.configuration.mathSelectionLevel,
        setValue: (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.configuration.mathSelectionLevel = value as "element" | "operand"
        },
      })
    }

    if (enabled("shape") && canvas.configuration.recognition["raw-content"].recognition?.types.includes("shape")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-shape-level`,
        label: "Shape selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Stroke", value: "stroke" },
        ],
        getValue: (canvas: TInteractiveInkCanvas) => canvas.configuration.shapeSelectionLevel,
        setValue: (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.configuration.shapeSelectionLevel = value as "element" | "stroke"
        },
      })
    }

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-selection`,
      label: "Selection",
      menuTitle: "Selection",
      icon: frameSelectIcon,
      position: "right-top",
      items,
    }

    super(config, canvas)
  }
}
