import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TEdge, TMath, TPoint, TShape, TStroke, TSymbol, TText } from "@/symbol"
import { EdgeKind, ShapeKind } from "@/symbol"
import { EdgeOps } from "@/symbol/edge/Edge"
import { ShapeOps } from "@/symbol/shape/Shape"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import { MatrixTransform } from "@/transform"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IITranslateManager extends IIAbstractTransformManager {
  protected managerName = "IITranslateManager"
  protected transformName = "translate"
  transformOrigin!: TPoint

  constructor(editor: TInteractiveInkEditor) {
    super(editor)
  }

  protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke {
    this.applyMatrixToPoints(stroke.pointers, matrix)
    StrokeOps.updateBounds(stroke)
    return stroke
  }

  protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape {
    switch (shape.kind) {
      case ShapeKind.Ellipse:
      case ShapeKind.Circle: {
        shape.center = matrix.applyToPoint(shape.center)
        ShapeOps.updateShapeDerivedFields(shape)
        return shape
      }
      case ShapeKind.Polygon: {
        this.applyMatrixToPoints(shape.points, matrix)
        ShapeOps.updateShapeDerivedFields(shape)
        return shape
      }
      default:
        throw new Error(`Can't apply translate on shape, kind unknown: ${JSON.stringify(shape)}`)
    }
  }

  protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.center = matrix.applyToPoint(edge.center)
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
      case EdgeKind.Line: {
        edge.start = matrix.applyToPoint(edge.start)
        edge.end = matrix.applyToPoint(edge.end)
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
      case EdgeKind.PolyEdge: {
        this.applyMatrixToPoints(edge.points, matrix)
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
    }
    return edge
  }

  protected applyOnText(text: TText, matrix: MatrixTransform): TText {
    if (text.rotation) {
      text.rotation.center = matrix.applyToPoint(text.rotation.center)
    }
    const np = matrix.applyToPoint(text.point)
    text.point.x = +np.x.toFixed(3)
    text.point.y = +np.y.toFixed(3)
    return this.editor.typeset.updateBounds(text)
  }

  protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath {
    if (math.rotation) {
      math.rotation.center = matrix.applyToPoint(math.rotation.center)
    }
    const np = matrix.applyToPoint(math.point)
    math.point.x = +np.x.toFixed(3)
    math.point.y = +np.y.toFixed(3)

    const bp = matrix.applyToPoint(math.bounds.center)
    math.bounds.center.x = +bp.x.toFixed(3)
    math.bounds.center.y = +bp.y.toFixed(3)

    math.elements.forEach((e) => {
      const ep = matrix.applyToPoint({
        x: e.bounds.x,
        y: e.bounds.y,
      })
      e.bounds.x = +ep.x.toFixed(3)
      e.bounds.y = +ep.y.toFixed(3)
    })

    return math
  }

  translate(symbols: TSymbol[], tx: number, ty: number, addToHistory = true): Promise<void> {
    this.logger.info("translate", {
      symbols,
      tx,
      ty,
    })
    this.editor.connector.clearAnchoredEdgesFor(symbols)
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.applyAndDraw(symbols, matrix)
    this.applyTransformToGhostStrokesForSelectedMath(symbols, matrix)
    this.editor.connector.updateAnchoredEdges(symbols.map((s) => s.id))
    if (addToHistory) {
      this.editor.history.push(this.model, {
        translate: [
          {
            symbols: this.model.symbolsSelected,
            tx,
            ty,
          },
        ],
      })
    }
    const strokes = this.editor.extractStrokesFromSymbols(symbols)
    return this.editor.recognizer.transformTranslate(
      strokes.map((s) => s.id),
      tx,
      ty
    )
  }

  translateElement(id: string, tx: number, ty: number): void {
    this.logger.info("translateElement", {
      id,
      tx,
      ty,
    })
    this.editor.renderer.setAttribute(id, "transform", `translate(${tx},${ty})`)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { origin })
    // Optimistic: reflects "working" on the state badge as soon as the drag starts. Cleared by
    // the debounced synchronize() triggered by onContentChanged once the transform is acked.
    this.editor.startOperation("Recognizing")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.transformOrigin = origin
  }

  continue(point: TPoint): {
    tx: number
    ty: number
  } {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't translate, you must call start before")
    }

    let tx = point.x - this.transformOrigin.x
    let ty = point.y - this.transformOrigin.y

    const nudge = this.editor.snaps.snapTranslate(tx, ty)
    tx = nudge.x
    ty = nudge.y

    this.translateElement(this.interactElementsGroup.id as string, tx, ty)
    this.model.symbolsSelected.forEach((s) => {
      this.translateElement(s.id as string, tx, ty)
    })
    this.getGhostStrokeIdsForSelectedMath(this.model.symbolsSelected).forEach((id) => {
      this.translateElement(id, tx, ty)
    })
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.editor.connector.drawAnchoredEdgesForMatrix(
      this.model.symbolsSelected.map((s) => s.id),
      matrix
    )
    return { tx, ty }
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    const { tx, ty } = this.continue(point)
    this.editor.snaps.clearSnapToElementLines()
    await this.translate(this.model.symbolsSelected, tx, ty)
    this.finalizeTransform()
  }
}
