import { SvgElementRole } from "@/Constants"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import type { TEdge, TMath, TPoint, TShape, TStroke, TSymbol, TText } from "@/symbol"
import { isStroke, SymbolType } from "@/symbol"
import type { MatrixTransform } from "@/transform"

import { IIAbstractManager } from "../IIAbstractManager"

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * @group Manager
 */
export abstract class IIAbstractTransformManager extends IIAbstractManager {
  protected abstract transformName: string
  interactElementsGroup?: SVGElement

  constructor(editor: TInteractiveInkEditor) {
    super(editor, LoggerCategory.TRANSFORMER)
  }

  protected applyMatrixToPoints(points: TPoint[], matrix: MatrixTransform): void {
    points.forEach((p) => {
      const np = matrix.applyToPoint(p)
      p.x = +np.x.toFixed(3)
      p.y = +np.y.toFixed(3)
    })
  }

  setTransformOrigin(id: string, originX: number, originY: number): void {
    this.editor.renderer.setAttribute(id, "transform-origin", `${originX}px ${originY}px`)
  }

  protected resolveInteractGroup(target: Element): SVGGElement {
    return target.closest(`[role=${SvgElementRole.InteractElementsGroup}]`) as unknown as SVGGElement
  }

  protected applyAndDraw(symbols: TSymbol[], matrix: MatrixTransform): void {
    symbols.forEach((s) => {
      this.applyToSymbol(s, matrix)
      this.editor.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
    })
  }

  protected finalizeTransform(): void {
    this.interactElementsGroup = undefined
    this.editor.overlays.apply()
    this.editor.selector.drawSelectedGroup(this.editor.model.symbolsSelected)
  }

  protected clearResultStrokesForSelectedMath(): void {
    const ids = new Set<string>()
    this.model.symbolsSelected.forEach((s) => {
      if (isStroke(s) && s.jiixBlockType === "Math" && s.jiixBlockId) {
        ids.add(s.jiixBlockId)
      }
    })
    ids.forEach((id) => this.editor.math.clearSolverOutputs(id))
  }

  protected abstract applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke
  protected abstract applyToShape(shape: TShape, matrix: MatrixTransform): TShape
  protected abstract applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge
  protected abstract applyOnText(text: TText, matrix: MatrixTransform): TText
  protected abstract applyOnMath(math: TMath, matrix: MatrixTransform): TMath

  applyToSymbol(symbol: TSymbol, matrix: MatrixTransform): TSymbol {
    this.logger.info("applyToSymbol", { symbol })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol, matrix)
      case SymbolType.Shape:
        return this.applyToShape(symbol, matrix)
      case SymbolType.Edge:
        return this.applyToEdge(symbol, matrix)
      case SymbolType.Text:
        return this.applyOnText(symbol, matrix)
      case SymbolType.Math:
        return this.applyOnMath(symbol, matrix)
      default:
        throw new Error(`Can't apply ${this.transformName} on symbol, type unknown: ${JSON.stringify(symbol)}`)
    }
  }
}
