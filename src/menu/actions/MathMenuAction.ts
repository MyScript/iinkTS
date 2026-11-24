import type { TInteractiveInkCanvas } from "@/canvas"
import type { TRecognitionWebSocketConfiguration } from "@/client"
import { IIMathCapabilitiesTable, IIMathVariableCanvas } from "@/components"
import type { TPartialDeep } from "@/core"
import type { TMathResultMode } from "@/manager"

import type { TMenuItemBase } from "../items/BaseMenuItem"
import type { TMenuRange } from "../items/RangeMenuItem"
import type { TMenuSelect } from "../items/SelectMenuItem"
import type { TMenuSubMenu, TSubMenuItems } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

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
  solver?: boolean | TMathSolverItemsConfig
}
/** @group Menu */
export type TMathActionConfig = boolean | TMathActionItemsConfig

/**
 * @group Menu
 * @remarks Solver settings shown in Math > Solver; each one is shown unless set to `false`
 */
export type TMathSolverItemsConfig = {
  angleUnit?: boolean
  fractionalDigits?: boolean
  decimalSeparator?: boolean
  roundingMode?: boolean
}

/**
 * @group Menu
 * @remarks Wait after the last move of the fractional digits slider before resynchronizing
 */
export const MATH_SOLVER_DEBOUNCE_MS = 300

const SOLVER_ITEM_KEYS: (keyof TMathSolverItemsConfig)[] = [
  "angleUnit",
  "fractionalDigits",
  "decimalSeparator",
  "roundingMode",
]

type TWebSocketSolverConfiguration = NonNullable<NonNullable<TRecognitionWebSocketConfiguration["math"]>["solver"]>
type TSolverChange = TPartialDeep<TWebSocketSolverConfiguration>

class Debouncer {
  #timer?: ReturnType<typeof setTimeout>

  constructor(private readonly delay: number) {}

  schedule(callback: () => void): void {
    this.cancel()
    this.#timer = setTimeout(callback, this.delay)
  }

  cancel(): void {
    clearTimeout(this.#timer)
    this.#timer = undefined
  }
}

const isAutoVariableEnabled = (canvas: TInteractiveInkCanvas): boolean =>
  canvas.configuration.recognition.math?.solver?.["auto-variable-management"]?.enable === true

/** Every change resynchronizes the session: a failure is reported by the canvas error event, and
 * the menu update that follows realigns the widgets on the restored configuration. */
const changeSolver = (canvas: TInteractiveInkCanvas, solver: TSolverChange): void => {
  canvas.updateRecognitionConfiguration({ math: { solver } }).catch(() => undefined)
}

type TSolverSelect<T extends string> = TMenuItemBase & {
  choices: { value: T; label: string }[]
  serverDefault?: boolean
  read: (solver: TWebSocketSolverConfiguration) => T | undefined
  write: (value: T | undefined) => TSolverChange
}

function solverSelect<T extends string>(select: TSolverSelect<T>): TMenuSelect {
  const { choices, serverDefault, read, write, ...base } = select
  const options = serverDefault ? [{ value: "", label: "Server default" }, ...choices] : choices
  return {
    ...base,
    type: "select",
    options,
    getValue: (canvas) => {
      const solver = canvas.configuration.recognition.math?.solver
      return (solver && read(solver)) ?? ""
    },
    setValue: (canvas, value) => changeSolver(canvas, write(choices.find((c) => c.value === value)?.value)),
  }
}

function fractionalDigitsRange(canvas: TInteractiveInkCanvas, id: string, debouncer: Debouncer): TMenuRange {
  return {
    type: "range",
    id,
    label: "Decimals",
    min: 0,
    max: 10,
    step: 1,
    unit: "",
    initValue: canvas.configuration.recognition.math?.solver?.["fractional-part-digits"],
    onChange: (value, canvas) => debouncer.schedule(() => changeSolver(canvas, { "fractional-part-digits": value })),
  }
}

function buildSolverItems(
  canvas: TInteractiveInkCanvas,
  id: string,
  debouncer: Debouncer
): Record<keyof TMathSolverItemsConfig, TSubMenuItems> {
  return {
    angleUnit: solverSelect({
      id: `${id}-angle-unit`,
      label: "Angle unit",
      choices: [
        { value: "deg", label: "Degrees" },
        { value: "rad", label: "Radians" },
      ],
      read: (solver) => solver["angle-unit"],
      write: (value) => ({ "angle-unit": value }),
    }),
    fractionalDigits: fractionalDigitsRange(canvas, `${id}-fractional-digits`, debouncer),
    decimalSeparator: solverSelect({
      id: `${id}-decimal-separator`,
      label: "Decimal separator",
      choices: [
        { value: ".", label: "Dot (.)" },
        { value: ",", label: "Comma (,)" },
      ],
      read: (solver) => solver["decimal-separator"],
      write: (value) => ({ "decimal-separator": value }),
    }),
    roundingMode: solverSelect({
      id: `${id}-rounding-mode`,
      label: "Rounding",
      choices: [
        { value: "half up", label: "Half up" },
        { value: "truncate", label: "Truncate" },
      ],
      read: (solver) => solver["rounding-mode"],
      write: (value) => ({ "rounding-mode": value }),
    }),
  }
}

function buildSolverSubMenu(
  canvas: TInteractiveInkCanvas,
  idPrefix: string,
  itemsConfig: TMathSolverItemsConfig | true | undefined,
  debouncer: Debouncer
): TMenuSubMenu {
  const id = `${idPrefix}-math-solver`
  const allItems = buildSolverItems(canvas, id, debouncer)
  const items = SOLVER_ITEM_KEYS.filter((key) => itemsConfig === true || itemsConfig?.[key] !== false).map(
    (key) => allItems[key]
  )
  return { type: "submenu", id, label: "Solver", menuTitle: "Solver", position: "right-top", items }
}

/**
 * @group Menu
 * @remarks Menu action for Math visualization and interaction controls
 */
export class MathMenuAction extends SubMenuItem {
  #cancelPendingSolverChange: () => void

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TMathActionItemsConfig) {
    const enabled = (key: keyof TMathActionItemsConfig) => itemsConfig?.[key] !== false
    const solverDebouncer = new Debouncer(MATH_SOLVER_DEBOUNCE_MS)

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-math`,
      label: "Math",
      menuTitle: "Math",
      position: "right-top",
      items: [],
    }

    if (itemsConfig?.solver !== false) {
      config.items.push(buildSolverSubMenu(canvas, idPrefix, itemsConfig?.solver, solverDebouncer))
    }

    if (enabled("autoCompute")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-math-auto-compute`,
        label: "Auto-compute",
        getValue: (canvas: TInteractiveInkCanvas) => canvas.math.getComputationConfig().autoCompute,
        setValue: async (canvas: TInteractiveInkCanvas, value: boolean) => {
          canvas.math.updateComputationConfig({
            autoCompute: value,
          })
          if (value) {
            await canvas.math.tryAutoCompute()
          }
        },
      })
    }

    if (enabled("forceComputeAll")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-math-force-compute-all`,
        label: "Force Compute all",
        action: async (canvas: TInteractiveInkCanvas) => {
          await canvas.math.forceCompute()
        },
      })
    }

    if (enabled("resultMode")) {
      config.items.push({
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
        getValue: (canvas: TInteractiveInkCanvas) => canvas.math.getComputationConfig().resultMode,
        setValue: async (canvas: TInteractiveInkCanvas, value: string) => {
          const mode = value as TMathResultMode
          canvas.math.updateComputationConfig({
            resultMode: mode,
          })
          await canvas.math.clearAllSolverOutputs()

          if (mode === "draw") {
            await canvas.math.computeAllNumericalResults()
          }
        },
      })
    }

    if (enabled("resultColor")) {
      config.items.push({
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
        getValue: (canvas: TInteractiveInkCanvas) => canvas.math.getComputationConfig().resultColor,
        setValue: async (canvas: TInteractiveInkCanvas, value: string) => {
          canvas.math.updateComputationConfig({
            resultColor: value,
          })
          await canvas.math.clearAllSolverOutputs()
          await canvas.math.computeAllNumericalResults()
        },
      })
    }

    if (enabled("showDependencies")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-math-show-dependency-on-hover`,
        visible: isAutoVariableEnabled,
        label: "Show Dependencies on Hover",
        getValue: (canvas: TInteractiveInkCanvas) => canvas.math.getVariablesConfig().showDependencyOnHover,
        setValue: (canvas: TInteractiveInkCanvas, value: boolean) => {
          canvas.math.updateVariablesConfig({
            showDependencyOnHover: value,
          })
          if (!value) {
            canvas.math.clearVariableInteractions()
          }
        },
      })
    }

    if (enabled("highlightOnSelect")) {
      config.items.push({
        type: "checkbox",
        id: `${idPrefix}-math-highlight-on-select`,
        visible: isAutoVariableEnabled,
        label: "Highlight on Select",
        getValue: (canvas: TInteractiveInkCanvas) => canvas.math.getVariablesConfig().highlightOnSelect,
        setValue: (canvas: TInteractiveInkCanvas, value: boolean) => {
          canvas.math.updateVariablesConfig({
            highlightOnSelect: value,
          })
        },
      })
    }

    if (enabled("editVariables")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-math-variables`,
        label: "Edit Variables",
        action: async (canvas: TInteractiveInkCanvas) => {
          const variableCanvas = new IIMathVariableCanvas(canvas)
          await variableCanvas.show()
        },
      })
    }

    if (enabled("capabilities")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-math-capabilities-overview`,
        label: "Show Math Capabilities Overview",
        action: async (canvas: TInteractiveInkCanvas) => {
          const capabilitiesTable = new IIMathCapabilitiesTable(canvas)
          await capabilitiesTable.show()
        },
      })
    }

    super(config, canvas)
    this.#cancelPendingSolverChange = () => solverDebouncer.cancel()
  }

  destroy(): void {
    this.#cancelPendingSolverChange()
    super.destroy()
  }
}
