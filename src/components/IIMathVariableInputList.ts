import { DOMFactory } from "@/components/dom"

/**
 * @group Components
 */
export type TVariableInputItem = {
  id?: string
  name: string
  initialValue?: number
  sourceType?: string
  sourceLabel?: string // human-readable label of the definition block (replaces raw sourceId)
  isDefinition?: boolean
  targetLabel?: string // label of the block where this variable is used
  disabled?: boolean
  onDelete?: (name: string) => Promise<void>
}

export const SOURCE_TYPE_COLORS: Record<string, string> = {
  UNDEFINED: "var(--iink-secondary)",
  API: "var(--iink-info)",
  API_GLOBAL: "var(--iink-primary)",
  BLOCK: "var(--iink-success)",
  PREDEFINED: "var(--iink-warning)",
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  UNDEFINED: "Undefined",
  API: "API",
  API_GLOBAL: "Global",
  BLOCK: "Block",
  PREDEFINED: "Predefined",
}

/**
 * @group Components
 * @remarks Pure UI component — renders a list of variable input rows.
 * Use getValues() to retrieve all valid (non-empty, non-NaN) inputs.
 */
export class IIMathVariableInputList {
  readonly element: HTMLDivElement
  private inputs: Map<string, HTMLInputElement> = new Map()

  constructor(items: TVariableInputItem[]) {
    this.element = DOMFactory.div({
      className: "ms-flex-col ms-gap-md",
    })
    items.forEach((item) => this.element.appendChild(this.createRow(item)))
  }

  private createRow(item: TVariableInputItem): HTMLDivElement {
    const hasTarget = !!item.targetLabel
    const colDefs = hasTarget
      ? item.onDelete
        ? "80px 90px 70px 1fr 1fr 28px"
        : "80px 90px 70px 1fr 1fr"
      : item.onDelete
        ? "120px 1fr 70px 1fr 28px"
        : "120px 1fr 70px 1fr"

    const row = DOMFactory.div({
      className: "ms-var-row",
      style: `display: grid; grid-template-columns: ${colDefs}; gap: var(--iink-spacing-sm);`,
    })

    const nameLabel = DOMFactory.div({
      text: item.name,
      className: "ms-var-name-label",
    })
    row.appendChild(nameLabel)

    const input = DOMFactory.numberInput({
      id: item.id ?? item.name,
      value: item.initialValue,
      step: "any",
      placeholder: "Enter value",
      disabled: item.disabled ?? false,
    })
    row.appendChild(input)
    this.inputs.set(item.id ?? item.name, input)

    const typeCell = DOMFactory.div({
      className: "ms-type-cell",
    })
    if (item.sourceType) {
      const typeLabel = DOMFactory.span({
        text: SOURCE_TYPE_LABELS[item.sourceType] ?? item.sourceType,
        className: "ms-type-label",
        style: `color: ${SOURCE_TYPE_COLORS[item.sourceType] ?? "var(--iink-text-muted)"};`,
      })
      typeCell.appendChild(typeLabel)
    }
    row.appendChild(typeCell)

    const sourceInfo = DOMFactory.div({
      className: "ms-source-info",
    })
    if (item.sourceLabel) {
      const labelEl = DOMFactory.span({
        text: item.sourceLabel,
        title: item.sourceLabel,
        className: "ms-source-label",
      })
      sourceInfo.appendChild(labelEl)
    }
    row.appendChild(sourceInfo)

    if (hasTarget) {
      const targetEl = DOMFactory.div({
        text: item.targetLabel!,
        title: item.targetLabel!,
        className: "ms-target-label",
      })
      row.appendChild(targetEl)
    }

    if (item.onDelete) {
      const deleteBtn = DOMFactory.button({
        label: "✕",
        title: "Delete variable",
        type: "button",
        variant: "danger",
      })
      deleteBtn.addEventListener("click", async () => {
        await item.onDelete!(item.name)
        this.removeRow(item.id ?? item.name)
      })
      row.appendChild(deleteBtn)
    }

    return row
  }

  removeRow(name: string): void {
    const input = this.inputs.get(name)
    if (input) {
      input.parentElement?.remove()
      this.inputs.delete(name)
    }
  }

  getValues(): Map<string, number> {
    const result = new Map<string, number>()
    for (const [name, input] of this.inputs) {
      if (input.value === "") {
        continue
      }
      const value = parseFloat(input.value)
      if (!isNaN(value)) {
        result.set(name, value)
      }
    }
    return result
  }
}
