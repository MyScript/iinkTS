import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { IIMathCapabilitiesTable, IIMathVariableEditor } from "@/components"
import type { TMathResultMode } from "@/manager/interactive/math"
import type { TMenuButton } from "@/menu/items/ButtonMenuItem"
import type { TMenuCheckbox } from "@/menu/items/CheckboxMenuItem"
import type { TMenuSelect } from "@/menu/items/SelectMenuItem"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TMathActionItemsConfig = {
  autoCompute?: boolean
  resultMode?: boolean
  resultColor?: boolean
  showDependencies?: boolean
  highlightOnSelect?: boolean
  editVariables?: boolean
  capabilities?: boolean
  forceComputeAll?: boolean
}
/** @group Menu */
export type TMathActionConfig = boolean | TMathActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
export class MathMenuAction extends SubMenuItem {
  constructor(editor: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TMathActionItemsConfig) {
    const enabled = (key: keyof TMathActionItemsConfig) => itemsConfig?.[key] !== false

    const items: (TMenuCheckbox | TMenuSelect | TMenuButton)[] = []

    if (enabled("autoCompute")) {
      items.push({
        type: "checkbox",
        id: `${idPrefix}-math-auto-compute`,
        label: "Auto-compute",
        getValue: (editor: TInteractiveInkCanvas) => editor.math.getComputationConfig().autoCompute,
        setValue: async (editor: TInteractiveInkCanvas, value: boolean) => {
          editor.math.updateComputationConfig({
            autoCompute: value,
          })
          if (value) {
            await editor.math.tryAutoCompute()
          }
        },
      })
    }

    if (enabled("forceComputeAll")) {
      items.push({
        type: "button",
        id: `${idPrefix}-math-force-compute-all`,
        label: "Force Compute all",
        action: async (editor: TInteractiveInkCanvas) => {
          await editor.math.clearAllSolverOutputs()
          await editor.math.computeAllNumericalResults()
        },
      })
    }

    if (enabled("resultMode")) {
      items.push({
        type: "select",
        id: `${idPrefix}-math-result-mode`,
        label: "Result mode",
        options: [
          { label: "Draw result", value: "draw" },
          {
            label: "Show result",
            value: "ghost",
          },
        ],
        getValue: (editor: TInteractiveInkCanvas) => editor.math.getComputationConfig().resultMode,
        setValue: async (editor: TInteractiveInkCanvas, value: string) => {
          const mode = value as TMathResultMode
          editor.math.updateComputationConfig({
            resultMode: mode,
          })
          await editor.math.clearAllSolverOutputs()

          if (mode === "draw") {
            await editor.math.computeAllNumericalResults()
          }
        },
      })
    }

    if (enabled("resultColor")) {
      items.push({
        type: "select",
        id: `${idPrefix}-math-result-color`,
        label: "Result color",
        options: [
          { label: "Green", value: "#4caf50" },
          { label: "Blue", value: "#1976d2" },
          { label: "Red", value: "#e53935" },
          { label: "Orange", value: "#ff9800" },
          { label: "Purple", value: "#9c27b0" },
          { label: "Black", value: "#000000" },
        ],
        getValue: (editor: TInteractiveInkCanvas) => editor.math.getComputationConfig().resultColor,
        setValue: async (editor: TInteractiveInkCanvas, value: string) => {
          editor.math.updateComputationConfig({
            resultColor: value,
          })
          await editor.math.clearAllSolverOutputs()
          await editor.math.computeAllNumericalResults()
        },
      })
    }

    if (editor.configuration.recognition.math?.solver?.["auto-variable-management"]?.enable) {
      if (enabled("showDependencies")) {
        items.push({
          type: "checkbox",
          id: `${idPrefix}-math-show-dependency-on-hover`,
          label: "Show Dependencies on Hover",
          getValue: (editor: TInteractiveInkCanvas) => editor.math.getVariablesConfig().showDependencyOnHover,
          setValue: (editor: TInteractiveInkCanvas, value: boolean) => {
            editor.math.updateVariablesConfig({
              showDependencyOnHover: value,
            })
            if (!value) {
              editor.math.clearVariableInteractions()
            }
          },
        })
      }

      if (enabled("highlightOnSelect")) {
        items.push({
          type: "checkbox",
          id: `${idPrefix}-math-highlight-on-select`,
          label: "Highlight on Select",
          getValue: (editor: TInteractiveInkCanvas) => editor.math.getVariablesConfig().highlightOnSelect,
          setValue: (editor: TInteractiveInkCanvas, value: boolean) => {
            editor.math.updateVariablesConfig({
              highlightOnSelect: value,
            })
          },
        })
      }
    }

    if (enabled("editVariables")) {
      items.push({
        type: "button",
        id: `${idPrefix}-math-variables`,
        label: "Edit Variables",
        action: async (editor: TInteractiveInkCanvas) => {
          const variableEditor = new IIMathVariableEditor(editor)
          await variableEditor.show()
        },
      })
    }

    if (enabled("capabilities")) {
      items.push({
        type: "button",
        id: `${idPrefix}-math-capabilities-overview`,
        label: "Show Math Capabilities Overview",
        action: async (editor: TInteractiveInkCanvas) => {
          const capabilitiesTable = new IIMathCapabilitiesTable(editor)
          await capabilitiesTable.show()
        },
      })
    }

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-math`,
      label: "Math (∑)",
      menuTitle: "Math (∑)",
      position: "right-top",
      items: items,
    }

    super(config, editor)
  }
}
