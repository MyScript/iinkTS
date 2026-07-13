import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TMathVariable, TMathVariableDefinition, TMathVariableDefinitions } from "@/client"
import { SOURCE_TYPE_COLORS, SOURCE_TYPE_LABELS } from "@/components/IIMathVariableInputList"
import { LoggerCategory } from "@/logger"
import type { TJIIXMathElement, TJIIXMathExpression } from "@/model/ExportMath"
import type { TBox, TStroke } from "@/symbol"
import { isRecognizedMath, isStroke } from "@/symbol"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps } from "@/symbol/primitives/OBB"
import { convertBoundingBoxMillimeterToPixel, getBoxConnectionPoint } from "@/utils"

import { ColorPaletteManager } from "../../base"
import { IIAbstractManager } from "../IIAbstractManager"
import type { TVariableEncartItem } from "../IIOverlayManager"

/**
 * Type representing math symbol dependencies
 * @group Manager
 */
export type TMathDependencies = {
  /**
   * Map of variable names to their source block IDs
   */
  variableSources?: {
    [variableName: string]: string
  }

  /**
   * Array of block IDs that depend on this block
   */
  dependentBlocks?: string[]

  /**
   * Variables used by this block that aren't linked to another block (API, API_GLOBAL, PREDEFINED, UNDEFINED)
   */
  externalVariables?: TMathVariable[]
}

/**
 * Configuration for math interaction features
 * @group Manager
 */
export type TMathInteractionConfig = {
  showDependencyOnHover: boolean
  highlightOnSelect: boolean
  dimOpacity: number
}

/**
 * One display row for a variable in a specific math block context.
 * @group Manager
 */
export type TMathVariableUsage = TMathVariable & {
  id: string
  targetBlockId: string // blockId for set/remove API calls
  targetLabel: string // display: label of the block this row represents
  sourceLabel?: string // display: label of the block that defines this variable (BLOCK-typed only)
  isDefinition: boolean // true if targetBlock IS the definition block for this variable
  isEditable: boolean // true if user can set/delete this usage
}

/**
 * Unified sub-manager for math variable state, dependency tracking, and visual interactions.
 *
 * Responsibilities:
 * - Variable values: store, set, get per block
 * - Dependency graph: variable sources, dependent blocks, enrichment, cleanup
 * - Interaction visuals: hover highlighting, selection highlighting, dependency arrows
 *
 * @group Manager
 */
export class IIMathVariableSubManager extends IIAbstractManager {
  protected managerName = "IIMathVariableSubManager"

  private static readonly DEFAULT_CONFIG: TMathInteractionConfig = {
    showDependencyOnHover: false,
    highlightOnSelect: false,
    dimOpacity: 0.3,
  }

  private static readonly HIGHLIGHT_STYLES = {
    SOURCE_COLOR: "#4CAF50",
    DEPENDENT_COLOR: "#FF9800",
    DASH_ARRAY: "5 3",
  }

  #dependencies: Map<string, TMathDependencies> = new Map()
  #variableCache: Map<string, TMathVariable[]> = new Map()
  #variableDefsCache: TMathVariableDefinitions[] | null = null
  #variableDefinitionCache: Map<string, TMathVariableDefinition | null> = new Map()

  #config: TMathInteractionConfig
  #hoveredJiixBlockId: string | null = null
  #selectedJiixBlockIds: Set<string> = new Set()
  #colorManager: ColorPaletteManager

  constructor(canvas: TInteractiveInkCanvas, config: Partial<TMathInteractionConfig> = {}) {
    super(canvas, LoggerCategory.MATH)
    this.#colorManager = ColorPaletteManager.getInstance()
    this.#config = {
      ...IIMathVariableSubManager.DEFAULT_CONFIG,
      ...config,
    }
  }

  updateConfig(config: Partial<TMathInteractionConfig>): void {
    this.logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
  }

  getConfig(): TMathInteractionConfig {
    return { ...this.#config }
  }

  private getMathSymbols(): TStroke[] {
    return this.canvas.model.symbols.filter(isRecognizedMath)
  }

  findMathSymbolsByJiixId(jiixId: string): TStroke[] {
    return this.canvas.model.symbols.filter(
      (s) => isStroke(s) && s.jiixBlockId === jiixId && s.jiixBlockType === "Math"
    ) as TStroke[]
  }

  private getBlockBounds(jiixBlockId: string): TBox | null {
    const strokes = this.findMathSymbolsByJiixId(jiixBlockId)
    if (!strokes.length) {
      return null
    }
    return BoxOps.createFromBoxes(strokes.map((s) => OBBOps.toBox(s.bounds)))
  }

  private getAllMathBlockIds(): string[] {
    return this.canvas.jiix.getAllMathBlocksWithStrokes().map((b) => b.mathBlock.id)
  }

  protected findVariableBoxesInExpressions(expressions: TJIIXMathExpression[], variableName: string): TBox[] {
    const boxes: TBox[] = []
    for (const expr of expressions) {
      if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
        for (const operand of expr.operands) {
          if (!operand) {
            continue
          }
          if (
            operand.type === "variable" &&
            "label" in operand &&
            operand.label === variableName &&
            operand["bounding-box"]
          ) {
            boxes.push(convertBoundingBoxMillimeterToPixel(operand["bounding-box"]))
          }
          if ("operands" in operand && operand.operands && Array.isArray(operand.operands)) {
            boxes.push(...this.findVariableBoxesInExpressions([operand], variableName))
          }
        }
      }
    }
    return boxes
  }

  getDependencies(blockId: string): TMathDependencies | null {
    return this.#dependencies.get(blockId) ?? null
  }

  async enrichMathDependencies(jiixBlockId: string): Promise<void> {
    try {
      this.invalidateCache(jiixBlockId)
      this.logger.info("enrichMathDependencies", `Starting enrichment for "${jiixBlockId}"`)

      const variables = await this.getVariables(jiixBlockId)

      if (!variables || variables.length === 0) {
        this.logger.debug("enrichMathDependencies", `No variables in "${jiixBlockId}"`)

        const existing = this.#dependencies.get(jiixBlockId)
        if (
          (existing?.variableSources && Object.keys(existing.variableSources).length > 0) ||
          (existing?.externalVariables && existing.externalVariables.length > 0)
        ) {
          this.#dependencies.set(jiixBlockId, {
            ...existing,
            variableSources: {},
            externalVariables: [],
          })
        }
        return
      }

      const ownDefinition = await this.asVariableDefinition(jiixBlockId)
      const externalVariables = variables.filter(
        (variable) => variable.sourceType !== "BLOCK" && variable.name !== ownDefinition?.name
      )

      this.logger.info(
        "enrichMathDependencies",
        `Found ${variables.length} variables:`,
        variables.map((v) => `${v.name} (sourceType: ${v.sourceType}, sourceId: ${v.sourceId})`)
      )

      const newVariableSources: {
        [variableName: string]: string
      } = {}

      for (const variable of variables) {
        if (variable.sourceType === "BLOCK" && variable.sourceId) {
          newVariableSources[variable.name] = variable.sourceId

          const sourceDeps = this.#dependencies.get(variable.sourceId) ?? {}
          const currentDependentBlocks = sourceDeps.dependentBlocks ?? []

          if (!currentDependentBlocks.includes(jiixBlockId)) {
            this.#dependencies.set(variable.sourceId, {
              ...sourceDeps,
              dependentBlocks: [...currentDependentBlocks, jiixBlockId],
            })
            this.logger.info(
              "enrichMathDependencies",
              `Added "${jiixBlockId}" to dependentBlocks of source block ${variable.sourceId}`
            )
          }
        } else {
          this.logger.debug(
            "enrichMathDependencies",
            `Variable "${variable.name}" sourceType "${variable.sourceType}", skipping`
          )
        }
      }

      const existing = this.#dependencies.get(jiixBlockId) ?? {}
      this.#dependencies.set(jiixBlockId, {
        ...existing,
        variableSources: newVariableSources,
        externalVariables,
      })

      this.logger.info("enrichMathDependencies", `Enriched "${jiixBlockId}" with variableSources:`, newVariableSources)
      this.canvas.event.emitChanged(this.canvas.history.context)
    } catch (error) {
      this.logger.error("enrichMathDependencies", { error })
    }
  }

  cleanupMathDependencies(jiixBlockIds: string[]): void {
    const existingJiixIds = new Set(jiixBlockIds)

    for (const [id] of this.#dependencies) {
      if (!existingJiixIds.has(id)) {
        this.#variableCache.delete(id)
        this.#dependencies.delete(id)
      }
    }

    for (const jiixBlockId of jiixBlockIds) {
      let needsUpdate = false
      const deps = this.#dependencies.get(jiixBlockId)
      if (!deps) {
        continue
      }

      let updatedDependentBlocks = deps.dependentBlocks
      let updatedVariableSources = deps.variableSources

      if (deps.dependentBlocks && deps.dependentBlocks.length > 0) {
        const filtered = deps.dependentBlocks.filter((id) => existingJiixIds.has(id))
        const removedCount = deps.dependentBlocks.length - filtered.length
        if (removedCount > 0) {
          this.logger.info(
            "cleanupMathDependencies",
            `Removed ${removedCount} deleted dependent(s) from block ${jiixBlockId}`
          )
          updatedDependentBlocks = filtered
          needsUpdate = true
        }
      }

      if (deps.variableSources && Object.keys(deps.variableSources).length > 0) {
        const stale = Object.entries(deps.variableSources)
          .filter(([, sourceId]) => !existingJiixIds.has(sourceId))
          .map(([varName]) => varName)
        if (stale.length > 0) {
          updatedVariableSources = {
            ...deps.variableSources,
          }
          stale.forEach((varName) => delete updatedVariableSources![varName])
          this.logger.info(
            "cleanupMathDependencies",
            `Removed ${stale.length} stale variable source(s) from block ${jiixBlockId}`
          )
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        this.#dependencies.set(jiixBlockId, {
          ...deps,
          dependentBlocks: updatedDependentBlocks,
          variableSources: updatedVariableSources,
        })
      }
    }

    const blockToSources = new Map<string, Set<string>>()
    for (const jiixBlockId of jiixBlockIds) {
      const deps = this.#dependencies.get(jiixBlockId)
      blockToSources.set(jiixBlockId, deps?.variableSources ? new Set(Object.values(deps.variableSources)) : new Set())
    }

    for (const jiixBlockId of jiixBlockIds) {
      const deps = this.#dependencies.get(jiixBlockId)
      if (!deps?.dependentBlocks || deps.dependentBlocks.length === 0) {
        continue
      }

      const filtered = deps.dependentBlocks.filter((depId) => {
        const sources = blockToSources.get(depId)
        if (!sources) {
          this.logger.warn("cleanupMathDependencies", `Dependent block "${depId}" not in blockToSources, keeping`)
          return true
        }
        return sources.has(jiixBlockId)
      })

      const removedCount = deps.dependentBlocks.length - filtered.length
      if (removedCount > 0) {
        this.logger.info(
          "cleanupMathDependencies",
          `Removed ${removedCount} inconsistent dependent(s) from block ${jiixBlockId}`
        )
        this.#dependencies.set(jiixBlockId, {
          ...deps,
          dependentBlocks: filtered,
        })
      }
    }
  }

  invalidateCache(jiixBlockId: string): void {
    if (jiixBlockId === "") {
      this.#variableCache.clear()
      this.#variableDefinitionCache.clear()
    } else {
      this.#variableCache.delete(jiixBlockId)
      this.#variableDefinitionCache.delete(jiixBlockId)
    }
    this.#variableDefsCache = null
  }

  async getVariables(jiixBlockId: string = ""): Promise<TMathVariable[]> {
    const cached = this.#variableCache.get(jiixBlockId)
    if (cached) {
      this.logger.debug("getVariables", {
        jiixBlockId,
        source: "cache",
      })
      return cached
    }
    this.logger.info("getVariables", {
      jiixBlockId,
    })
    const variables = await this.canvas.client.getVariables(jiixBlockId)
    const definition = jiixBlockId ? await this.asVariableDefinition(jiixBlockId) : null
    const enriched: TMathVariable[] = variables.map((v) => ({
      ...v,
      isDefinition: !!definition && definition.name === v.name,
    }))
    this.#variableCache.set(jiixBlockId, enriched)
    return enriched
  }

  async getVariableValue(jiixBlockId: string, variableName: string): Promise<number | null> {
    this.logger.info("getVariableValue", {
      jiixBlockId,
      variableName,
    })
    const variables = await this.getVariables(jiixBlockId)
    return variables.find((v) => v.name === variableName)?.value ?? null
  }

  async setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void> {
    this.logger.info("setVariableValue", {
      jiixBlockId,
      variableName,
      variableValue,
    })
    await this.canvas.client.setVariableValue(jiixBlockId, variableName, variableValue)
    this.invalidateCache(jiixBlockId)
  }

  async removeVariableValue(jiixBlockId: string, variableName: string): Promise<void> {
    this.logger.info("removeVariableValue", {
      jiixBlockId,
      variableName,
    })
    await this.canvas.client.removeVariableValue(jiixBlockId, variableName)
    this.invalidateCache(jiixBlockId)
  }

  async asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null> {
    if (this.#variableDefinitionCache.has(jiixBlockId)) {
      this.logger.debug("asVariableDefinition", {
        jiixBlockId,
        source: "cache",
      })
      return this.#variableDefinitionCache.get(jiixBlockId) ?? null
    }
    try {
      this.logger.info("asVariableDefinition", {
        jiixBlockId,
      })
      const definition = await this.canvas.client.asVariableDefinition(jiixBlockId)
      this.#variableDefinitionCache.set(jiixBlockId, definition)
      return definition
    } catch {
      this.#variableDefinitionCache.set(jiixBlockId, null)
      return null
    }
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]> {
    if (this.#variableDefsCache) {
      this.logger.debug("getVariableDefinitions", { source: "cache" })
      return this.#variableDefsCache
    }
    this.logger.info("getVariableDefinitions")
    const defs = await this.canvas.client.getVariableDefinitions()
    this.#variableDefsCache = defs
    return defs
  }

  async getAllVariableUsages(): Promise<TMathVariableUsage[]> {
    const defs = await this.getVariableDefinitions()
    const usages: TMathVariableUsage[] = []

    // One row per definition entry (authoritative source of truth)
    for (const vd of defs) {
      for (const d of vd.definitions) {
        const targetLabel = d.blockId ? (this.canvas.jiix.getBlockLabel(d.blockId) ?? d.blockId) : "Global"
        usages.push({
          id: `${vd.name}|def|${d.blockId || "global"}|${d.sourceType}`,
          name: vd.name,
          value: d.value,
          targetBlockId: d.blockId,
          targetLabel,
          sourceType: d.sourceType,
          sourceId: d.blockId || undefined,
          sourceLabel: undefined,
          isDefinition: true,
          isEditable: d.sourceType === "API_GLOBAL" || d.sourceType === "API",
        })
      }
    }

    // Usage rows: blocks that consume variables from elsewhere
    const defKeys = new Set(usages.map((u) => `${u.name}|${u.targetBlockId}`))

    const allBlockVars = new Map<string, TMathVariable[]>()
    await Promise.all(
      this.getAllMathBlockIds().map(async (id) => {
        allBlockVars.set(id, await this.getVariables(id))
      })
    )

    for (const [blockId, variables] of allBlockVars) {
      const targetLabel = this.canvas.jiix.getBlockLabel(blockId) ?? blockId
      for (const variable of variables) {
        if (variable.sourceType === "UNDEFINED") {
          continue
        }
        if (variable.sourceType === "PREDEFINED") {
          continue
        }
        if (defKeys.has(`${variable.name}|${blockId}`)) {
          continue
        }

        const sourceLabel =
          variable.sourceType === "BLOCK" && variable.sourceId
            ? (this.canvas.jiix.getBlockLabel(variable.sourceId) ?? variable.sourceId)
            : undefined

        usages.push({
          id: `${variable.name}|${blockId}`,
          name: variable.name,
          value: variable.value ?? undefined,
          targetBlockId: blockId,
          targetLabel,
          sourceType: variable.sourceType,
          sourceId: variable.sourceId,
          sourceLabel,
          isDefinition: false,
          isEditable: true,
        })
      }
    }

    return usages
  }

  getRecursiveSources(jiixBlockId: string, visited: Set<string> = new Set()): Set<string> {
    const sources = new Set<string>()

    if (visited.has(jiixBlockId)) {
      return sources
    }
    visited.add(jiixBlockId)

    const deps = this.getDependencies(jiixBlockId)
    if (!deps?.variableSources) {
      return sources
    }

    Object.values(deps.variableSources).forEach((sourceJiixId) => {
      if (!visited.has(sourceJiixId)) {
        sources.add(sourceJiixId)
        this.getRecursiveSources(sourceJiixId, visited).forEach((id) => sources.add(id))
      }
    })

    return sources
  }

  getRecursiveDependents(jiixBlockId: string, visited: Set<string> = new Set()): Set<string> {
    const dependents = new Set<string>()

    if (visited.has(jiixBlockId)) {
      return dependents
    }
    visited.add(jiixBlockId)

    const deps = this.getDependencies(jiixBlockId)
    if (!deps?.dependentBlocks) {
      return dependents
    }

    deps.dependentBlocks.forEach((dependentJiixId) => {
      if (!visited.has(dependentJiixId)) {
        dependents.add(dependentJiixId)
        this.getRecursiveDependents(dependentJiixId, visited).forEach((id) => dependents.add(id))
      }
    })

    return dependents
  }

  private buildExternalVariableItems(jiixBlockId: string): TVariableEncartItem[] {
    const externalVariables = this.getDependencies(jiixBlockId)?.externalVariables ?? []
    return externalVariables.map((variable) => {
      const sourceType = variable.sourceType ?? "UNDEFINED"
      return {
        name: variable.name,
        value: variable.value?.toString() ?? "undefined",
        typeLabel: SOURCE_TYPE_LABELS[sourceType] ?? sourceType,
        typeColor: SOURCE_TYPE_COLORS[sourceType] ?? SOURCE_TYPE_COLORS.UNDEFINED,
        swatchColor: this.#colorManager.getColorForVariable(variable.name),
      }
    })
  }

  /** Highlights each listed variable's occurrence(s) in the block's ink, colored to match its encart row. */
  private highlightExternalVariableOccurrences(jiixBlockId: string, items: TVariableEncartItem[]): void {
    const firstStroke = this.findMathSymbolsByJiixId(jiixBlockId)[0]
    const mathExpressions = firstStroke
      ? (this.canvas.jiix.getElementForStroke(firstStroke.id) as TJIIXMathElement | undefined)?.expressions
      : undefined
    if (!mathExpressions) {
      return
    }

    items.forEach((item) => {
      const boxes = this.findVariableBoxesInExpressions(mathExpressions, item.name)
      boxes.forEach((box, i) => {
        this.canvas.overlays.highlightWithColor(box, `${jiixBlockId}-extvar-${item.name}-occ${i}`, item.name)
      })
    })
  }

  /** Shows the variable-value encart centered on the block, plus matching in-ink highlights. No-op if there's nothing to show. */
  private showExternalVariablesEncart(jiixBlockId: string): void {
    const items = this.buildExternalVariableItems(jiixBlockId)
    if (items.length === 0) {
      return
    }

    const bounds = this.getBlockBounds(jiixBlockId)
    if (!bounds) {
      return
    }

    const anchor = { x: bounds.x, y: bounds.y }
    this.canvas.overlays.showVariableEncart({ anchor, items })
    this.highlightExternalVariableOccurrences(jiixBlockId, items)
  }

  onSymbolHover(jiixBlockId: string | null): void {
    if (!this.#config.showDependencyOnHover) {
      return
    }

    if (this.#hoveredJiixBlockId) {
      this.clearHoverHighlights()
    }

    if (!jiixBlockId) {
      this.#hoveredJiixBlockId = null
      return
    }

    this.#hoveredJiixBlockId = jiixBlockId
    this.logger.debug("onSymbolHover", {
      jiixBlockId,
    })

    const sources = this.getRecursiveSources(jiixBlockId)
    sources.forEach((sourceJiixId) => {
      const bounds = this.getBlockBounds(sourceJiixId)
      if (bounds) {
        this.canvas.overlays.highlightPrimary(sourceJiixId, bounds)
      }
    })

    const dependents = this.getRecursiveDependents(jiixBlockId)
    dependents.forEach((dependentJiixId) => {
      const bounds = this.getBlockBounds(dependentJiixId)
      if (bounds) {
        this.canvas.overlays.highlightLinked(dependentJiixId, bounds)
      }
    })

    const hoveredBounds = this.getBlockBounds(jiixBlockId)
    if (hoveredBounds) {
      this.canvas.overlays.addHoverGlow(jiixBlockId, hoveredBounds)
    }

    this.drawDependencyArrows(jiixBlockId, sources, dependents)
    this.showExternalVariablesEncart(jiixBlockId)
  }

  private clearHoverHighlights(): void {
    this.logger.debug("clearHoverHighlights")
    this.canvas.overlays.clearHighlights()
    this.clearDependencyArrows()
  }

  selectBlock(jiixBlockId: string): void {
    this.clearSelectionHighlights()

    this.#selectedJiixBlockIds = new Set([jiixBlockId])

    if (!this.#config.highlightOnSelect) {
      return
    }

    this.logger.debug("selectBlock", {
      jiixBlockId,
    })

    const sources = this.getRecursiveSources(jiixBlockId)
    const dependents = this.getRecursiveDependents(jiixBlockId)

    const relatedJiixIds = new Set<string>([jiixBlockId])
    sources.forEach((id) => relatedJiixIds.add(id))
    dependents.forEach((id) => relatedJiixIds.add(id))

    const allJiixIds = new Set<string>()
    this.getMathSymbols().forEach((s) => {
      if (s.jiixBlockId) {
        allJiixIds.add(s.jiixBlockId)
      }
    })
    allJiixIds.forEach((jid) => {
      if (!relatedJiixIds.has(jid)) {
        const bounds = this.getBlockBounds(jid)
        if (bounds) {
          this.canvas.overlays.dimSymbol(jid, bounds, this.#config.dimOpacity)
        }
      }
    })

    sources.forEach((sourceJiixId) => {
      const bounds = this.getBlockBounds(sourceJiixId)
      if (bounds) {
        this.canvas.overlays.highlightPrimary(sourceJiixId, bounds)
      }
    })

    dependents.forEach((dependentJiixId) => {
      const bounds = this.getBlockBounds(dependentJiixId)
      if (bounds) {
        this.canvas.overlays.highlightLinked(dependentJiixId, bounds)
      }
    })

    this.drawDependencyArrows(jiixBlockId, sources, dependents)
    this.showExternalVariablesEncart(jiixBlockId)
  }

  clearBlockSelection(): void {
    this.clearSelectionHighlights()
    this.#selectedJiixBlockIds.clear()
  }

  private clearSelectionHighlights(): void {
    this.logger.debug("clearSelectionHighlights")
    this.canvas.overlays.clearHighlights()
    this.canvas.overlays.clearDimming()
  }

  protected drawDependencyArrowToBox(fromId: string, fromBounds: TBox, toId: string, toBox: TBox, color: string): void {
    const arrowId = `arrow-${fromId}-${toId}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    this.renderer.removeSymbol(arrowId)

    const toCenter = {
      x: toBox.x + toBox.width / 2,
      y: toBox.y + toBox.height / 2,
    }
    const fromCenter = {
      x: fromBounds.x + fromBounds.width / 2,
      y: fromBounds.y + fromBounds.height / 2,
    }
    const { x: startX, y: startY } = getBoxConnectionPoint(fromBounds, toCenter)
    const { x: endX, y: endY } = getBoxConnectionPoint(toBox, fromCenter)

    const path = `M ${startX} ${startY} L ${endX} ${endY}`
    const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    arrowPath.setAttribute("id", arrowId)
    arrowPath.setAttribute("d", path)
    const markerId = this.ensureArrowheadMarker(color)
    arrowPath.setAttribute("stroke", color)
    arrowPath.setAttribute("stroke-width", "2")
    arrowPath.setAttribute("fill", "transparent")
    arrowPath.setAttribute("marker-end", `url(#${markerId})`)
    arrowPath.setAttribute("data-overlay", "arrow")
    arrowPath.setAttribute("style", "pointer-events: none;")
    this.renderer.layer.appendChild(arrowPath)
  }

  protected ensureArrowheadMarker(color: string): string {
    const markerId = `arrowhead-${color.replace(/[^a-zA-Z0-9]/g, "_")}`
    if (this.renderer.layer.querySelector(`#${markerId}`)) {
      return markerId
    }

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
    marker.setAttribute("id", markerId)
    marker.setAttribute("markerWidth", "10")
    marker.setAttribute("markerHeight", "10")
    marker.setAttribute("refX", "9")
    marker.setAttribute("refY", "3")
    marker.setAttribute("orient", "auto")

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
    polygon.setAttribute("points", "0 0, 10 3, 0 6")
    polygon.setAttribute("fill", color)

    marker.appendChild(polygon)
    defs.appendChild(marker)
    this.renderer.layer.appendChild(defs)
    return markerId
  }

  clearDependencyArrows(): void {
    this.renderer.clearElements({
      attrs: { "data-overlay": "arrow" },
    })
  }

  protected drawDependencyArrows(jiixBlockId: string, sources: Set<string>, dependents: Set<string>): void {
    const hoveredBounds = this.getBlockBounds(jiixBlockId)
    if (!hoveredBounds) {
      return
    }

    // Any stroke of the hovered block shares the same JIIX — use first for expression lookup
    const hoveredFirstStroke = this.findMathSymbolsByJiixId(jiixBlockId)[0]

    sources.forEach((sourceJiixId) => {
      const sourceBounds = this.getBlockBounds(sourceJiixId)
      if (!sourceBounds) {
        return
      }

      const deps = this.getDependencies(jiixBlockId)
      if (!deps?.variableSources) {
        return
      }

      for (const [variableName, depSourceJiixId] of Object.entries(deps.variableSources)) {
        if (depSourceJiixId !== sourceJiixId) {
          continue
        }

        const mathExpressions = hoveredFirstStroke
          ? (this.canvas.jiix.getElementForStroke(hoveredFirstStroke.id) as TJIIXMathElement | undefined)?.expressions
          : undefined

        if (mathExpressions) {
          const variableBoxes = this.findVariableBoxesInExpressions(mathExpressions, variableName)
          if (variableBoxes.length > 0) {
            const variableColor = this.#colorManager.getColorForVariable(variableName)
            this.canvas.overlays.highlightPrimary(sourceJiixId, sourceBounds, variableColor)
            variableBoxes.forEach((variableBox, i) => {
              this.canvas.overlays.highlightWithColor(variableBox, `${jiixBlockId}-occ${i}`, variableName)
              this.drawDependencyArrowToBox(
                `${sourceJiixId}-occ${i}`,
                sourceBounds,
                `${jiixBlockId}-occ${i}`,
                variableBox,
                variableColor
              )
            })
            continue
          }
        }

        this.drawDependencyArrowToBox(
          sourceJiixId,
          sourceBounds,
          jiixBlockId,
          hoveredBounds,
          IIMathVariableSubManager.HIGHLIGHT_STYLES.SOURCE_COLOR
        )
      }
    })

    dependents.forEach((dependentJiixId) => {
      const depBounds = this.getBlockBounds(dependentJiixId)
      if (!depBounds) {
        return
      }

      const depDeps = this.getDependencies(dependentJiixId)
      if (!depDeps?.variableSources) {
        return
      }

      const depFirstStroke = this.findMathSymbolsByJiixId(dependentJiixId)[0]

      for (const [variableName, sourceJiixId] of Object.entries(depDeps.variableSources)) {
        if (sourceJiixId !== jiixBlockId) {
          continue
        }

        const depMathExpressions = depFirstStroke
          ? (this.canvas.jiix.getElementForStroke(depFirstStroke.id) as TJIIXMathElement | undefined)?.expressions
          : undefined

        if (depMathExpressions) {
          const variableBoxes = this.findVariableBoxesInExpressions(depMathExpressions, variableName)
          if (variableBoxes.length > 0) {
            const variableColor = this.#colorManager.getColorForVariable(variableName)
            variableBoxes.forEach((variableBox, i) => {
              this.canvas.overlays.highlightWithColor(variableBox, `${dependentJiixId}-occ${i}`, variableName)
              this.drawDependencyArrowToBox(
                `${jiixBlockId}-occ${i}`,
                hoveredBounds,
                `${dependentJiixId}-occ${i}`,
                variableBox,
                variableColor
              )
            })
            continue
          }
        }

        this.drawDependencyArrowToBox(
          jiixBlockId,
          hoveredBounds,
          dependentJiixId,
          depBounds,
          IIMathVariableSubManager.HIGHLIGHT_STYLES.DEPENDENT_COLOR
        )
      }
    })
  }

  clearAll(): void {
    this.logger.info("clearAll")
    this.clearHoverHighlights()
    this.clearSelectionHighlights()
    this.#hoveredJiixBlockId = null
    this.#selectedJiixBlockIds.clear()
  }

  clear(): void {
    this.#dependencies.clear()
    this.#variableCache.clear()
    this.#variableDefsCache = null
    this.#variableDefinitionCache.clear()
  }

  protected onDestroy(): void {
    this.clear()
  }
}
