import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { LoggerCategory } from "@/logger"
import type {
  TJIIXEdgeElement,
  TJIIXElement,
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXNodeElement,
  TJIIXStrokeItem,
  TJIIXTextElement,
} from "@/model"
import { JIIXElementType } from "@/model"
import type { TBox, TStroke, TSymbol } from "@/symbol"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps } from "@/symbol/primitives/OBB"
import { convertBoundingBoxMillimeterToPixel, convertMillimeterToPixel } from "@/utils"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * Text metadata for a block
 * @group Manager
 */
export type TBlockTextMetadata = {
  label?: string
  word?: {
    label: string
    firstChar?: number
    lastChar?: number
    bounds?: TBox
    id?: string
  }
  char?: {
    label: string
    word: number
    bounds?: TBox
  }
  line?: { baseline: number; xHeight: number }
}

/**
 * Result type for stroke queries
 * @group Manager
 */
export type TStrokeQueryResult = {
  /** The stroke ID */
  strokeId: string
  /** The JIIX element containing this stroke */
  element: TJIIXElement
  /** The precise label for this stroke */
  label?: string
  /** Additional context (word, char, expression, etc.) */
  context?: {
    /** For text strokes: word info */
    word?: { label: string; index: number }
    /** For text strokes: char info */
    char?: {
      label: string
      index: number
      wordIndex: number
    }
    /** For math strokes: expression info */
    expression?: {
      type: string
      label?: string
      expressionPath: string
    }
  }
}

/**
 * Indexed JIIX data for fast queries
 * @group Manager
 */
export type TJiixIndex = {
  /** Map stroke ID -> parent element */
  strokeToElement: Map<string, TJIIXElement>
  /** Map stroke ID -> precise label */
  strokeToLabel: Map<string, string>
  /** Map stroke ID -> context info */
  strokeToContext: Map<string, TStrokeQueryResult["context"]>
  /** Map element ID -> all stroke IDs */
  elementToStrokes: Map<string, string[]>
  /** Map element ID -> element (for label lookup without needing model.exports) */
  elementById: Map<string, TJIIXElement>
  /** Cache version for invalidation */
  version: number
}

/**
 * @group Manager
 * @remarks Manager for querying JIIX export data efficiently
 * Provides fast lookups for strokes, labels, and element groupings
 * Automatically indexes JIIX data on first access and invalidates cache when model changes
 */
export class IIJiixQueryManager extends IIAbstractManager {
  protected managerName = "IIJiixQueryManager"

  /** Indexed JIIX data */
  #index: TJiixIndex | null = null

  /** Current model version for cache invalidation */
  #modelVersion = 0

  /** Text metadata per stroke ID (pixel-converted, set during sync) */
  #textMetadata = new Map<string, TBlockTextMetadata>()

  constructor(editor: TInteractiveInkCanvas) {
    super(editor, LoggerCategory.JIIX_QUERY)
    this.logger.info("constructor", this.managerName)
  }

  /**
   * Build or rebuild the JIIX index
   * Called automatically when index is stale
   */
  protected buildIndex(): void {
    this.logger.debug("buildIndex", "Building JIIX index")

    const index: TJiixIndex = {
      strokeToElement: new Map(),
      strokeToLabel: new Map(),
      strokeToContext: new Map(),
      elementToStrokes: new Map(),
      elementById: new Map(),
      version: this.#modelVersion,
    }

    const jiixExport = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      this.#index = index
      return
    }

    // Index all elements
    for (const element of jiixExport.elements) {
      this.indexElement(element, index)
    }

    this.#index = index
    this.logger.debug(
      "buildIndex",
      `Indexed ${index.strokeToElement.size} strokes from ${jiixExport.elements.length} elements`
    )
  }

  /**
   * Index a single JIIX element and its strokes
   */
  protected indexElement(element: TJIIXElement, index: TJiixIndex): void {
    const elementStrokes: string[] = []

    switch (element.type) {
      case JIIXElementType.Text:
        this.indexTextElement(element as TJIIXTextElement, index, elementStrokes)
        break
      case JIIXElementType.Math:
        this.indexMathElement(element as TJIIXMathElement, index, elementStrokes)
        break
      case JIIXElementType.Node:
      case JIIXElementType.Edge:
        this.indexNodeOrEdgeElement(element, index, elementStrokes)
        break
    }

    if (elementStrokes.length > 0 && element.id) {
      index.elementToStrokes.set(element.id, elementStrokes)
    }
    if (element.id) {
      index.elementById.set(element.id, element)
    }
  }

  /**
   * Index a text element
   */
  protected indexTextElement(element: TJIIXTextElement, index: TJiixIndex, elementStrokes: string[]): void {
    // Index by words and chars for precise labels
    if (element.words) {
      element.words.forEach((word, wordIndex) => {
        if (word.items) {
          word.items.forEach((item: TJIIXStrokeItem) => {
            const strokeId = item["full-id"] || item.id
            if (strokeId) {
              elementStrokes.push(strokeId)
              index.strokeToElement.set(strokeId, element)
              index.strokeToLabel.set(strokeId, word.label)
              index.strokeToContext.set(strokeId, {
                word: {
                  label: word.label,
                  index: wordIndex,
                },
              })
            }
          })
        }
      })
    }

    // Index chars for character-level labels
    if (element.chars) {
      element.chars.forEach((char, charIndex) => {
        if (char.items) {
          char.items.forEach((item: TJIIXStrokeItem) => {
            const strokeId = item["full-id"] || item.id
            if (strokeId) {
              const existingContext = index.strokeToContext.get(strokeId)
              index.strokeToContext.set(strokeId, {
                ...existingContext,
                char: {
                  label: char.label,
                  index: charIndex,
                  wordIndex: char.word,
                },
              })
              // Update label to char label (more precise)
              index.strokeToLabel.set(strokeId, char.label)
            }
          })
        }
      })
    }

    // Fallback: index items directly from element
    if (element.items && (!element.words || element.words.length === 0)) {
      element.items.forEach((item: TJIIXStrokeItem) => {
        const strokeId = item["full-id"] || item.id
        if (strokeId) {
          elementStrokes.push(strokeId)
          index.strokeToElement.set(strokeId, element)
          index.strokeToLabel.set(strokeId, element.label)
        }
      })
    }
  }

  /**
   * Index a math element
   */
  protected indexMathElement(element: TJIIXMathElement, index: TJiixIndex, elementStrokes: string[]): void {
    // Index expressions recursively
    if (element.expressions) {
      element.expressions.forEach((expression, exprIndex) => {
        this.indexMathExpression(expression, element, index, elementStrokes, `expressions[${exprIndex}]`)
      })
    }

    // Fallback: index items directly from element
    if (element.items && (!element.expressions || element.expressions.length === 0)) {
      element.items.forEach((item: TJIIXStrokeItem) => {
        const strokeId = item["full-id"] || item.id
        if (strokeId) {
          elementStrokes.push(strokeId)
          index.strokeToElement.set(strokeId, element)
          index.strokeToLabel.set(strokeId, element.label || "")
        }
      })
    }
  }

  /**
   * Index a math expression recursively
   */
  protected indexMathExpression(
    expression: TJIIXMathExpression,
    element: TJIIXMathElement,
    index: TJiixIndex,
    elementStrokes: string[],
    path: string
  ): void {
    const exprRecord = expression as Record<string, unknown>

    // Index items in this expression
    if (exprRecord.items && Array.isArray(exprRecord.items)) {
      exprRecord.items.forEach((item: TJIIXStrokeItem) => {
        const strokeId = item["full-id"] || item.id
        if (strokeId) {
          elementStrokes.push(strokeId)
          index.strokeToElement.set(strokeId, element)
          index.strokeToLabel.set(strokeId, (exprRecord.label as string) || expression.type)
          index.strokeToContext.set(strokeId, {
            expression: {
              type: expression.type,
              label: exprRecord.label as string,
              expressionPath: path,
            },
          })
        }
      })
    }

    // Recurse into operands
    if ("operands" in expression && expression.operands && Array.isArray(expression.operands)) {
      expression.operands.forEach((operand: TJIIXMathExpression, opIndex: number) => {
        if (operand) {
          this.indexMathExpression(operand, element, index, elementStrokes, `${path}.operands[${opIndex}]`)
        }
      })
    }
  }

  /**
   * Index a node or edge element
   */
  protected indexNodeOrEdgeElement(
    element: TJIIXNodeElement | TJIIXEdgeElement,
    index: TJiixIndex,
    elementStrokes: string[]
  ): void {
    if (element.items) {
      element.items.forEach((item: TJIIXStrokeItem) => {
        const strokeId = item["full-id"] || item.id
        if (strokeId) {
          elementStrokes.push(strokeId)
          index.strokeToElement.set(strokeId, element)
          index.strokeToLabel.set(strokeId, element.id)
        }
      })
    }
  }

  /**
   * Ensure index is up to date.
   * When model.exports is absent (cleared by updateSymbol etc.) but a valid index exists,
   * preserve it rather than overwriting with an empty rebuild.
   */
  protected ensureIndexValid(): void {
    const currentVersion = this.model.modificationDate

    if (!this.#index || this.#modelVersion !== currentVersion) {
      if (!this.model.exports?.["application/vnd.myscript.jiix"]?.elements && this.#index) {
        // Exports cleared transiently — keep existing index, advance version marker
        this.#modelVersion = currentVersion
        return
      }
      this.#modelVersion = currentVersion
      this.buildIndex()
    }
  }

  /**
   * Invalidate and immediately rebuild the index from current exports.
   * Called after mergeExport so the rebuild happens while exports are still set,
   * before any subsequent updateSymbol calls clear them.
   */
  invalidateIndex(): void {
    this.logger.debug("invalidateIndex", "Invalidating JIIX index")
    this.#index = null
    const jiixExport = this.model.exports?.["application/vnd.myscript.jiix"]
    if (jiixExport?.elements) {
      this.#modelVersion = this.model.modificationDate
      this.buildIndex()
    }
  }

  /**
   * Get the JIIX element containing a stroke
   * @param strokeId - The stroke ID
   * @returns The JIIX element or undefined
   */
  getElementForStroke(strokeId: string): TJIIXElement | undefined {
    this.ensureIndexValid()
    return this.#index?.strokeToElement.get(strokeId)
  }

  /**
   * Get the precise label for a stroke
   * For text: returns char label if available, word label otherwise
   * For math: returns expression label or type
   * @param strokeId - The stroke ID
   * @returns The label or undefined
   */
  getLabelForStroke(strokeId: string): string | undefined {
    this.ensureIndexValid()
    return this.#index?.strokeToLabel.get(strokeId)
  }

  /**
   * Get detailed query result for a stroke
   * @param strokeId - The stroke ID
   * @returns Full query result with element, label, and context
   */
  getStrokeInfo(strokeId: string): TStrokeQueryResult | undefined {
    this.ensureIndexValid()

    const element = this.#index?.strokeToElement.get(strokeId)
    if (!element) {
      return undefined
    }

    return {
      strokeId,
      element,
      label: this.#index?.strokeToLabel.get(strokeId),
      context: this.#index?.strokeToContext.get(strokeId),
    }
  }

  /**
   * Get the JIIX word group for a stroke (for word-level decorator spanning).
   * Returns all stroke IDs in the same word and the word's pixel bounding box.
   */
  getWordGroupForStroke(strokeId: string): {
    wordKey: string
    wordBounds: TBox | null
    allStrokeIds: string[]
    baseline: number | null
    xHeight: number | null
  } | null {
    this.ensureIndexValid()
    const info = this.getStrokeInfo(strokeId)
    if (!info?.context?.word) {
      return null
    }
    const textElement = info.element as TJIIXTextElement
    const wordIndex = info.context.word.index
    const word = textElement.words?.[wordIndex]
    if (!word) {
      return null
    }
    const allStrokeIds = (word.items || []).map((item) => item["full-id"] || item.id).filter((id): id is string => !!id)
    const wordBounds = word["bounding-box"] ? convertBoundingBoxMillimeterToPixel(word["bounding-box"]) : null

    // Find the line containing this word via first-char/last-char indices
    let baseline: number | null = null
    let xHeight: number | null = null
    if (textElement.lines && textElement.chars) {
      const chars = textElement.chars
      const firstCharIndex = chars.findIndex((c) => c.word === wordIndex)
      if (firstCharIndex !== -1) {
        const line = textElement.lines.find(
          (l) =>
            (l["first-char"] === undefined || l["first-char"] <= firstCharIndex) &&
            (l["last-char"] === undefined || l["last-char"] >= firstCharIndex)
        )
        if (line) {
          baseline = convertMillimeterToPixel(line["baseline-y"])
          xHeight = convertMillimeterToPixel(line["x-height"])
        }
      }
    }

    return {
      wordKey: `${textElement.id}:${wordIndex}`,
      wordBounds,
      allStrokeIds,
      baseline,
      xHeight,
    }
  }

  /**
   * Get all stroke IDs belonging to an element
   * @param elementId - The JIIX element ID
   * @returns Array of stroke IDs
   */
  getStrokesForElement(elementId: string): string[] {
    this.ensureIndexValid()
    return this.#index?.elementToStrokes.get(elementId) || []
  }

  /**
   * Get all TStroke objects belonging to an element
   * @param elementId - The JIIX element ID
   * @returns Array of TStroke symbols
   */
  getStrokeSymbolsForElement(elementId: string): TStroke[] {
    const strokeIds = this.getStrokesForElement(elementId)
    const strokeMap = new Map<string, TStroke>()

    // Build map of available strokes
    for (const symbol of this.model.symbols) {
      if (symbol.type === "stroke") {
        const stroke = symbol as TStroke
        const strokeItems = stroke.pointers
        if (strokeItems && strokeItems.length > 0) {
          strokeMap.set(stroke.id, stroke)
        }
      }
    }

    // Return strokes in order
    return strokeIds.map((id) => strokeMap.get(id)).filter((stroke): stroke is TStroke => stroke !== undefined)
  }

  /**
   * Get all strokes grouped by word (for text elements)
   * @param elementId - The text element ID
   * @returns Array of word groups, each containing stroke IDs and label
   */
  getStrokesGroupedByWord(elementId: string): Array<{
    label: string
    strokeIds: string[]
  }> {
    this.ensureIndexValid()

    const element = this.#index?.elementToStrokes.get(elementId)
    if (!element) {
      return []
    }

    const jiixElement = this.model.exports?.["application/vnd.myscript.jiix"]?.elements?.find(
      (el) => el.id === elementId
    )

    if (!jiixElement || jiixElement.type !== JIIXElementType.Text) {
      return []
    }

    const textElement = jiixElement as TJIIXTextElement
    const groups: Array<{
      label: string
      strokeIds: string[]
    }> = []

    if (textElement.words) {
      for (const word of textElement.words) {
        const strokeIds: string[] = []
        if (word.items) {
          word.items.forEach((item: TJIIXStrokeItem) => {
            const strokeId = item["full-id"] || item.id
            if (strokeId) {
              strokeIds.push(strokeId)
            }
          })
        }
        if (strokeIds.length > 0) {
          groups.push({
            label: word.label,
            strokeIds,
          })
        }
      }
    }

    return groups
  }

  /**
   * Get all strokes grouped by character (for text elements)
   * @param elementId - The text element ID
   * @returns Array of char groups, each containing stroke IDs and label
   */
  getStrokesGroupedByChar(elementId: string): Array<{
    label: string
    strokeIds: string[]
    wordIndex: number
  }> {
    this.ensureIndexValid()

    const element = this.#index?.elementToStrokes.get(elementId)
    if (!element) {
      return []
    }

    const jiixElement = this.model.exports?.["application/vnd.myscript.jiix"]?.elements?.find(
      (el) => el.id === elementId
    )

    if (!jiixElement || jiixElement.type !== JIIXElementType.Text) {
      return []
    }

    const textElement = jiixElement as TJIIXTextElement
    const groups: Array<{
      label: string
      strokeIds: string[]
      wordIndex: number
    }> = []

    if (textElement.chars) {
      for (const char of textElement.chars) {
        const strokeIds: string[] = []
        if (char.items) {
          char.items.forEach((item: TJIIXStrokeItem) => {
            const strokeId = item["full-id"] || item.id
            if (strokeId) {
              strokeIds.push(strokeId)
            }
          })
        }
        if (strokeIds.length > 0) {
          groups.push({
            label: char.label,
            strokeIds,
            wordIndex: char.word,
          })
        }
      }
    }

    return groups
  }

  /**
   * Get all math blocks with their strokes
   * @returns Array of math blocks with their JIIX element and stroke IDs
   */
  getAllMathBlocksWithStrokes(): Array<{
    mathBlock: TJIIXMathElement
    strokeIds: string[]
    strokes: TStroke[]
  }> {
    this.ensureIndexValid()

    const mathBlocks = this.model.mathBlocks
    const result: Array<{
      mathBlock: TJIIXMathElement
      strokeIds: string[]
      strokes: TStroke[]
    }> = []

    for (const mathBlock of mathBlocks) {
      const strokeIds = this.getStrokesForElement(mathBlock.id)
      const strokes = this.getStrokeSymbolsForElement(mathBlock.id)

      result.push({
        mathBlock,
        strokeIds,
        strokes,
      })
    }

    return result
  }

  /**
   * Get all text blocks with their strokes
   * @returns Array of text blocks with their JIIX element and stroke IDs
   */
  getAllTextBlocksWithStrokes(): Array<{
    textBlock: TJIIXTextElement
    strokeIds: string[]
    strokes: TStroke[]
  }> {
    this.ensureIndexValid()

    const textBlocks = this.model.textBlocks
    const result: Array<{
      textBlock: TJIIXTextElement
      strokeIds: string[]
      strokes: TStroke[]
    }> = []

    for (const textBlock of textBlocks) {
      const strokeIds = this.getStrokesForElement(textBlock.id)
      const strokes = this.getStrokeSymbolsForElement(textBlock.id)

      result.push({
        textBlock,
        strokeIds,
        strokes,
      })
    }

    return result
  }

  /**
   * Get the label of a JIIX block by its ID
   * @param jiixBlockId - The JIIX element ID
   * @returns The label of the block, or undefined if not found
   */
  getBlockLabel(jiixBlockId: string): string | undefined {
    this.ensureIndexValid()

    const jiixElement = this.#index?.elementById.get(jiixBlockId)

    if (!jiixElement) {
      return undefined
    }

    if (jiixElement.type === JIIXElementType.Text) {
      return jiixElement.label
    }

    if (jiixElement.type === JIIXElementType.Math) {
      return jiixElement.label
    }

    return jiixElement.id
  }

  /**
   * Search strokes by label
   * @param label - The label to search for (case-insensitive partial match)
   * @returns Array of matching stroke query results
   */
  searchByLabel(label: string): TStrokeQueryResult[] {
    this.ensureIndexValid()

    const results: TStrokeQueryResult[] = []
    const searchTerm = label.toLowerCase()

    if (!this.#index) {
      return results
    }

    for (const [strokeId, strokeLabel] of this.#index.strokeToLabel.entries()) {
      if (strokeLabel.toLowerCase().includes(searchTerm)) {
        const info = this.getStrokeInfo(strokeId)
        if (info) {
          results.push(info)
        }
      }
    }

    return results
  }

  getBlocksForSymbols(symbols: TSymbol[]): TJIIXElement[] {
    this.ensureIndexValid()
    if (!this.#index) {
      return []
    }
    const symbolIds = new Set(symbols.map((s) => s.id))
    return [...this.#index.elementToStrokes.entries()]
      .filter(([, strokeIds]) => strokeIds.length > 0 && strokeIds.every((id) => symbolIds.has(id)))
      .map(([elementId]) => this.#index!.elementById.get(elementId))
      .filter((el): el is TJIIXElement => el !== undefined)
  }

  /**
   * Get statistics about the indexed JIIX
   * @returns Index statistics
   */
  getIndexStats(): {
    totalStrokes: number
    totalElements: number
    byType: Record<string, number>
    indexed: boolean
  } {
    this.ensureIndexValid()

    const stats = {
      totalStrokes: this.#index?.strokeToElement.size || 0,
      totalElements: this.#index?.elementToStrokes.size || 0,
      byType: {} as Record<string, number>,
      indexed: this.#index !== null,
    }

    if (this.#index) {
      for (const element of this.#index.strokeToElement.values()) {
        stats.byType[element.type] = (stats.byType[element.type] || 0) + 1
      }
    }

    return stats
  }

  /**
   * Get pixel-converted text metadata for a stroke
   */
  getTextMetadata(strokeId: string): TBlockTextMetadata | undefined {
    return this.#textMetadata.get(strokeId)
  }

  /**
   * Update pixel-converted text metadata for a stroke (called during sync)
   */
  updateTextMetadata(stroke: TStroke, element: TJIIXTextElement): void {
    const metadata: TBlockTextMetadata = {
      label: element.label,
    }

    if (element.words && element.words.length > 0) {
      const firstWord = element.words[0]
      metadata.word = {
        label: firstWord.label,
        bounds: firstWord["bounding-box"] ? convertBoundingBoxMillimeterToPixel(firstWord["bounding-box"]) : undefined,
      }
    }

    if (element.chars && element.chars.length > 0) {
      const firstChar = element.chars[0]
      metadata.char = {
        label: firstChar.label,
        word: firstChar.word,
        bounds: firstChar["bounding-box"] ? convertBoundingBoxMillimeterToPixel(firstChar["bounding-box"]) : undefined,
      }
    }

    if (element.lines && element.lines.length > 0) {
      const firstLine = element.lines[0]
      metadata.line = {
        baseline: convertMillimeterToPixel(firstLine["baseline-y"]),
        xHeight: convertMillimeterToPixel(firstLine["x-height"]),
      }
    }

    this.#textMetadata.set(stroke.id, metadata)
  }

  /**
   * Clear text metadata for a stroke (called when stroke is deleted)
   */
  clearTextMetadata(strokeId: string): void {
    this.#textMetadata.delete(strokeId)
  }

  /**
   * Get stroke groups with pixel bboxes for text selection.
   * Only groups with valid bounding boxes are returned.
   * @param level - Selection granularity: "element", "word", or "char"
   */
  getTextSelectionGroups(level: "element" | "word" | "char"): Array<{
    strokeIds: string[]
    bounds: TBox
  }> {
    this.ensureIndexValid()

    const jiixExport = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }

    const groups: Array<{
      strokeIds: string[]
      bounds: TBox
    }> = []

    for (const element of jiixExport.elements) {
      if (element.type !== JIIXElementType.Text) {
        continue
      }
      const textEl = element as TJIIXTextElement

      if (level === "element") {
        if (textEl["bounding-box"] && textEl.id) {
          const strokeIds = this.getStrokesForElement(textEl.id)
          if (strokeIds.length > 0) {
            groups.push({
              strokeIds,
              bounds: convertBoundingBoxMillimeterToPixel(textEl["bounding-box"]),
            })
          }
        }
      } else if (level === "word" && textEl.words) {
        for (const word of textEl.words) {
          if (word["bounding-box"] && word.items) {
            const strokeIds = word.items.map((i) => i["full-id"] || i.id).filter((id): id is string => !!id)
            if (strokeIds.length > 0) {
              groups.push({
                strokeIds,
                bounds: convertBoundingBoxMillimeterToPixel(word["bounding-box"]),
              })
            }
          }
        }
      } else if (level === "char" && textEl.chars) {
        for (const char of textEl.chars) {
          if (char["bounding-box"] && char.items) {
            const strokeIds = char.items.map((i) => i["full-id"] || i.id).filter((id): id is string => !!id)
            if (strokeIds.length > 0) {
              groups.push({
                strokeIds,
                bounds: convertBoundingBoxMillimeterToPixel(char["bounding-box"]),
              })
            }
          }
        }
      }
    }

    return groups
  }

  /**
   * Get stroke groups with pixel bboxes for math selection.
   * Only groups with valid bounding boxes are returned.
   * @param level - Selection granularity: "element" or "operand"
   */
  getMathSelectionGroups(level: "element" | "operand"): Array<{
    strokeIds: string[]
    bounds: TBox
  }> {
    this.ensureIndexValid()

    const jiixExport = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }

    const groups: Array<{
      strokeIds: string[]
      bounds: TBox
    }> = []

    for (const element of jiixExport.elements) {
      if (element.type !== JIIXElementType.Math) {
        continue
      }
      const mathEl = element as TJIIXMathElement

      if (level === "element") {
        if (mathEl.id) {
          const strokeIds = this.getStrokesForElement(mathEl.id)
          if (strokeIds.length > 0) {
            let bounds: TBox
            if (mathEl["bounding-box"]) {
              bounds = convertBoundingBoxMillimeterToPixel(mathEl["bounding-box"])
            } else {
              const strokes = this.getStrokeSymbolsForElement(mathEl.id)
              if (!strokes.length) {
                continue
              }
              bounds = BoxOps.createFromBoxes(strokes.map((s) => OBBOps.toBox(s.bounds)))
            }
            groups.push({ strokeIds, bounds })
          }
        }
      } else if (level === "operand" && mathEl.expressions) {
        this.collectMathExpressionGroups(mathEl.expressions, groups)
      }
    }

    return groups
  }

  /**
   * Get stroke groups with pixel bboxes for shape (Node/Edge) selection.
   * "element" level: one group per Node/Edge element.
   * "stroke" level: returns empty (signals fallback to stroke overlap).
   * @param level - Selection granularity: "element" or "stroke"
   */
  getShapeSelectionGroups(level: "element" | "stroke"): Array<{
    strokeIds: string[]
    bounds: TBox
  }> {
    if (level === "stroke") {
      return []
    }

    this.ensureIndexValid()

    const jiixExport = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiixExport?.elements) {
      return []
    }

    const groups: Array<{
      strokeIds: string[]
      bounds: TBox
    }> = []

    for (const element of jiixExport.elements) {
      if (element.type !== JIIXElementType.Node && element.type !== JIIXElementType.Edge) {
        continue
      }

      if (element["bounding-box"] && element.id) {
        const strokeIds = this.getStrokesForElement(element.id)
        if (strokeIds.length > 0) {
          groups.push({
            strokeIds,
            bounds: convertBoundingBoxMillimeterToPixel(element["bounding-box"]),
          })
        }
      }
    }

    return groups
  }

  /**
   * Recursively collect math expression groups with pixel bboxes
   */
  protected collectMathExpressionGroups(
    expressions: TJIIXMathExpression[],
    groups: Array<{
      strokeIds: string[]
      bounds: TBox
    }>
  ): void {
    for (const expr of expressions) {
      if (!expr) {
        continue
      }
      const exprRecord = expr as Record<string, unknown>
      const bbox = exprRecord["bounding-box"] as TBox | undefined
      const items = exprRecord.items as TJIIXStrokeItem[] | undefined

      if (bbox && items) {
        const strokeIds = items.map((i) => i["full-id"] || i.id).filter((id): id is string => !!id)
        if (strokeIds.length > 0) {
          groups.push({
            strokeIds,
            bounds: convertBoundingBoxMillimeterToPixel(bbox),
          })
        }
      }

      if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
        this.collectMathExpressionGroups(expr.operands, groups)
      }
    }
  }
}
