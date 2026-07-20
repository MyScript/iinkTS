import { SvgElementRole } from "@/Constants"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import type { TEdge, TMath, TPoint, TShape, TStroke, TSymbol, TText } from "@/symbol"
import { isDecorator, isStroke, SymbolType } from "@/symbol"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import { OBBOps } from "@/symbol/primitives/OBB"
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
    this.updateDecoratorsForTargets(symbols)
  }

  /**
   * Standalone decorators store their own bounds (set once from their targets' bounds)
   * and are never part of `symbolsSelected` (selection redirects to their targetIds), so
   * a translate/resize/rotate of the target symbols leaves the decorator's bounds stale.
   * Recompute them here from the (already transformed) target symbols.
   */
  private updateDecoratorsForTargets(symbols: TSymbol[]): void {
    const movedIds = new Set(symbols.map((s) => s.id))
    this.model.symbols.forEach((sym) => {
      if (!isDecorator(sym) || !sym.targetIds.some((id) => movedIds.has(id))) {
        return
      }
      const targetSyms = sym.targetIds.map((id) => this.model.getRootSymbol(id)).filter((s): s is TSymbol => !!s)
      if (targetSyms.length) {
        DecoratorOps.setBounds(sym, OBBOps.createFromOBBs(targetSyms.map((s) => s.bounds)))
        this.model.updateSymbol(sym)
        this.editor.renderer.drawSymbol(sym)
      }
    })
  }

  protected finalizeTransform(): void {
    this.interactElementsGroup = undefined
    this.editor.overlays.apply()
    this.editor.selector.drawSelectedGroup(this.editor.model.symbolsSelected)
  }

  private getSelectedMathBlockIds(symbols: TSymbol[]): Set<string> {
    const ids = new Set<string>()
    symbols.forEach((s) => {
      if (isStroke(s) && s.jiixBlockType === "Math" && s.jiixBlockId) {
        ids.add(s.jiixBlockId)
      }
    })
    return ids
  }

  /**
   * Element ids of the ghost previews attached to the given selection's math blocks —
   * for live CSS-transform following while a translate/resize/rotate drag is in progress.
   */
  protected getGhostStrokeIdsForSelectedMath(symbols: TSymbol[]): string[] {
    const ids: string[] = []
    this.getSelectedMathBlockIds(symbols).forEach((id) => {
      ids.push(...(this.editor.math.getGhostStrokeIds(id) ?? []))
    })
    return ids
  }

  /**
   * Permanently applies the given transform matrix to the ghost previews attached to the
   * selection's math blocks, so they stay visually attached once the drag settles.
   */
  protected applyTransformToGhostStrokesForSelectedMath(symbols: TSymbol[], matrix: MatrixTransform): void {
    this.getSelectedMathBlockIds(symbols).forEach((id) => {
      this.editor.math.applyTransformToGhostStrokes(id, matrix)
    })
  }

  protected abstract applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke
  protected abstract applyToShape(shape: TShape, matrix: MatrixTransform): TShape
  protected abstract applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge
  protected abstract applyOnText(text: TText, matrix: MatrixTransform): TText
  protected abstract applyOnMath(math: TMath, matrix: MatrixTransform): TMath

  applyToSymbol(symbol: TSymbol, matrix: MatrixTransform): TSymbol {
    if (symbol.type === SymbolType.Decorator) {
      return symbol
    }
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
