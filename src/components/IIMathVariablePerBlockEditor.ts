import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMathVariable, TMathVariableDefinition } from "@/client"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { TVariableInputItem } from "./IIMathVariableInputList"
import { IIMathVariableInputList } from "./IIMathVariableInputList"
import { Modal } from "./Modal"

/**
 * @group Components
 */
export type TSymbolVariables = {
  jiixBlockId: string
  definition: TMathVariableDefinition | null
  variables: TMathVariable[]
}

/**
 * @group Components
 * @remarks Modal canvas for variables of one or more math block symbols.
 * Fetches variables per jiixBlockId and applies changes via setListVariableValue.
 */
export class IIMathVariablePerBlockEditor {
  private canvas: TInteractiveInkCanvas
  private jiixBlockIds: string[]
  private modal?: Modal
  private blockVariables: TSymbolVariables[] = []
  private inputLists: Map<string, IIMathVariableInputList> = new Map()
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  constructor(canvas: TInteractiveInkCanvas, jiixBlockIds: string[]) {
    this.canvas = canvas
    this.jiixBlockIds = [...new Set(jiixBlockIds)]
  }

  async show(): Promise<void> {
    this.blockVariables = []
    this.inputLists.clear()

    for (const jiixBlockId of this.jiixBlockIds) {
      if (!jiixBlockId) {
        this.logger.warn("show", "Invalid jiixBlockId")
        continue
      }
      try {
        const definition = await this.canvas.math.asVariableDefinition(jiixBlockId)
        const variables = await this.canvas.math.getVariables(jiixBlockId)
        if (variables.length > 0) {
          this.blockVariables.push({
            jiixBlockId,
            definition,
            variables,
          })
        }
      } catch (error) {
        const label = this.canvas.jiix.getBlockLabel(jiixBlockId)
        this.logger.error("show", `Error fetching variables for JiixBlock ${label}:`, error)
      }
    }

    if (this.blockVariables.length === 0) {
      this.logger.warn("show", "No variables found in the selected symbols")
      return
    }

    const container = this.createModalContent()
    const count = this.blockVariables.length
    const title = `Edit Variable${count > 1 ? "s" : ""} (${count} symbol${count > 1 ? "s" : ""})`

    this.modal = new Modal({
      title,
      fields: [],
      customContent: container,
      container: this.canvas.layers.ui.root,
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
    this.blockVariables.forEach((symVar) => container.appendChild(this.createSymbolSection(symVar)))
    return container
  }

  private createSymbolSection(symVar: TSymbolVariables): HTMLDivElement {
    const section = DOMFactory.div({
      className: "ms-card",
    })

    const label = this.canvas.jiix.getBlockLabel(symVar.jiixBlockId) || "N/A"
    const expressionDiv = DOMFactory.div({
      className: "ms-expression-header",
      html: `<strong>Expression:</strong> ${label}`,
    })
    section.appendChild(expressionDiv)

    const items: TVariableInputItem[] = symVar.variables.map((variable) => {
      const isDefinition = symVar.definition?.name === variable.name
      const initialValue = variable.value ?? (isDefinition ? symVar.definition?.value : undefined)
      return {
        name: variable.name,
        initialValue,
        sourceType: variable.sourceType,
        sourceLabel:
          variable.sourceType === "BLOCK" && variable.sourceId
            ? (this.canvas.jiix.getBlockLabel(variable.sourceId) ?? variable.sourceId)
            : undefined,
        isDefinition,
        disabled: isDefinition || variable.sourceType === "PREDEFINED",
        onDelete:
          variable.sourceType === "API" || variable.sourceType === "API_GLOBAL"
            ? async (name) => {
                await this.canvas.math.removeVariable(symVar.jiixBlockId, name)
              }
            : undefined,
      }
    })

    const inputList = new IIMathVariableInputList(items)
    this.inputLists.set(symVar.jiixBlockId, inputList)
    section.appendChild(inputList.element)

    return section
  }

  private async applyChanges(): Promise<void> {
    try {
      const updates: Promise<void>[] = []

      for (const symVar of this.blockVariables) {
        const inputList = this.inputLists.get(symVar.jiixBlockId)
        if (!inputList) {
          continue
        }

        const allValues = inputList.getValues()
        const variableValues: Record<string, number> = {}
        let hasChanges = false

        for (const variable of symVar.variables) {
          const newValue = allValues.get(variable.name)
          if (newValue !== undefined && newValue !== variable.value) {
            variableValues[variable.name] = newValue
            hasChanges = true
          }
        }

        if (hasChanges) {
          updates.push(this.canvas.math.setListVariableValue(symVar.jiixBlockId, variableValues))
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates)
        this.logger.info("applyChanges", `Updated variables for ${updates.length} symbol(s)`)
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
    this.blockVariables = []
    this.inputLists.clear()
  }
}
