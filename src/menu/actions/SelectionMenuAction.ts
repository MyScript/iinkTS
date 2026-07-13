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
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TSelectionActionItemsConfig) {
    const enabled = (key: keyof TSelectionActionItemsConfig) => itemsConfig?.[key] !== false

    const items: TMenuSelect[] = []

    if (enabled("text") && editor.configuration.recognition["raw-content"].recognition?.types.includes("text")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-text-level`,
        label: "Text selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Word", value: "word" },
          { label: "Character", value: "char" },
        ],
        getValue: (editor: TInteractiveInkCanvas) => editor.configuration.textSelectionLevel,
        setValue: (editor: TInteractiveInkCanvas, value: string) => {
          editor.configuration.textSelectionLevel = value as "element" | "word" | "char"
        },
      })
    }

    if (enabled("math") && editor.configuration.recognition["raw-content"].recognition?.types.includes("math")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-math-level`,
        label: "Math selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Operand", value: "operand" },
        ],
        getValue: (editor: TInteractiveInkCanvas) => editor.configuration.mathSelectionLevel,
        setValue: (editor: TInteractiveInkCanvas, value: string) => {
          editor.configuration.mathSelectionLevel = value as "element" | "operand"
        },
      })
    }

    if (enabled("shape") && editor.configuration.recognition["raw-content"].recognition?.types.includes("shape")) {
      items.push({
        type: "select",
        id: `${idPrefix}-selection-shape-level`,
        label: "Shape selection",
        options: [
          { label: "Element", value: "element" },
          { label: "Stroke", value: "stroke" },
        ],
        getValue: (editor: TInteractiveInkCanvas) => editor.configuration.shapeSelectionLevel,
        setValue: (editor: TInteractiveInkCanvas, value: string) => {
          editor.configuration.shapeSelectionLevel = value as "element" | "stroke"
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

    super(config, editor)
  }
}
