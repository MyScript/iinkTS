import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TMathVariableUsage } from "@/manager/interactive/math"

import type { TVariableInputItem } from "./IIMathVariableInputList"
import { IIMathVariableInputList } from "./IIMathVariableInputList"
import { Modal } from "./Modal"

/**
 * @group Components
 * @remarks Modal canvas for all variable definitions returned by get-variable-definitions.
 * Shows one row per (variable, block) usage. Definition rows are read-only;
 * BLOCK-provided and free (UNDEFINED) variables are editable/deletable.
 */
export class IIMathVariableEditor {
  private canvas: TInteractiveInkCanvas
  private modal?: Modal
  private usages: TMathVariableUsage[] = []
  private usagesById: Map<string, TMathVariableUsage> = new Map()
  private inputList?: IIMathVariableInputList
  private newRows: Array<{
    nameInput: HTMLInputElement
    valueInput: HTMLInputElement
  }> = []
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  constructor(canvas: TInteractiveInkCanvas) {
    this.canvas = canvas
  }

  async show(): Promise<void> {
    this.usages = []
    this.usagesById = new Map()
    this.inputList = undefined
    this.newRows = []

    try {
      this.usages = await this.canvas.math.getAllVariableUsages()
    } catch (error) {
      this.logger.error("show", "Error fetching variable usages:", error)
      return
    }

    for (const usage of this.usages) {
      this.usagesById.set(usage.id, usage)
    }

    const container = this.createModalContent()

    this.modal = new Modal({
      title: "Variable Definitions",
      fields: [],
      customContent: container,
      container: this.canvas.layers.root,
      buttons: [
        {
          label: "Apply",
          variant: "primary",
          onClick: () => this.applyChanges(),
        },
      ],
    })

    this.modal.open()
  }

  private createModalContent(): HTMLDivElement {
    const container = DOMFactory.div({
      className: "ms-var-canvas-content",
    })

    if (this.usages.length > 0) {
      const section = DOMFactory.div({
        className: "ms-card",
      })

      const items: TVariableInputItem[] = this.usages.map((usage) => ({
        id: usage.id,
        name: usage.name,
        initialValue: usage.value,
        sourceType: usage.sourceType,
        sourceLabel: usage.sourceLabel,
        isDefinition: usage.isDefinition,
        targetLabel: usage.targetLabel,
        disabled: !usage.isEditable,
        onDelete: usage.isEditable
          ? async (name) => {
              await this.canvas.math.removeVariable(usage.targetBlockId, name)
            }
          : undefined,
      }))

      this.inputList = new IIMathVariableInputList(items)
      section.appendChild(this.inputList.element)
      container.appendChild(section)
    }

    container.appendChild(this.createAddSection())
    return container
  }

  private createAddSection(): HTMLDivElement {
    const section = DOMFactory.div({
      className: "ms-card",
    })

    const title = DOMFactory.div({
      text: "Add Global Variable",
      className: "ms-var-section-title",
    })
    section.appendChild(title)

    const newVarsContainer = DOMFactory.div({
      className: "ms-flex-col ms-gap-sm",
    })
    section.appendChild(newVarsContainer)

    const addButton = DOMFactory.button({
      label: "+ Add",
      className: "ms-add-var-btn",
    })
    addButton.addEventListener("click", () => {
      const { element, nameInput, valueInput } = this.createNewVariableRow()
      newVarsContainer.appendChild(element)
      this.newRows.push({ nameInput, valueInput })
      nameInput.focus()
    })
    section.appendChild(addButton)

    return section
  }

  private createNewVariableRow(): {
    element: HTMLDivElement
    nameInput: HTMLInputElement
    valueInput: HTMLInputElement
  } {
    const row = DOMFactory.div({
      className: "ms-new-var-row",
    })

    const nameInput = DOMFactory.textInput({
      placeholder: "Variable name",
    })
    row.appendChild(nameInput)

    const valueInput = DOMFactory.numberInput({
      placeholder: "Value",
      step: "any",
    })
    row.appendChild(valueInput)

    const deleteBtn = DOMFactory.button({
      label: "✕",
      title: "Remove row",
      variant: "danger",
    })
    deleteBtn.addEventListener("click", () => {
      this.newRows = this.newRows.filter((r) => r.nameInput !== nameInput)
      row.remove()
    })
    row.appendChild(deleteBtn)

    return { element: row, nameInput, valueInput }
  }

  private async applyChanges(): Promise<void> {
    try {
      const updates: Promise<void>[] = []

      if (this.inputList) {
        const allValues = this.inputList.getValues()
        for (const [id, newValue] of allValues) {
          const usage = this.usagesById.get(id)
          if (!usage || !usage.isEditable) {
            continue
          }
          if (usage.value !== newValue) {
            updates.push(this.canvas.math.setVariableValue(usage.targetBlockId, usage.name, newValue))
          }
        }
      }

      for (const { nameInput, valueInput } of this.newRows) {
        const name = nameInput.value.trim()
        const value = parseFloat(valueInput.value)
        if (name && !isNaN(value)) {
          updates.push(this.canvas.math.setVariableValue("", name, value))
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates)
        this.logger.info("applyChanges", `Updated ${updates.length} variable(s)`)
      }
      this.close()
      this.canvas.menu.context.update()
    } catch (error) {
      this.logger.error("applyChanges", "Error applying variable changes:", error)
    }
  }

  close(): void {
    this.modal?.destroy()
    this.modal = undefined
    this.usages = []
    this.usagesById = new Map()
    this.inputList = undefined
    this.newRows = []
  }
}
