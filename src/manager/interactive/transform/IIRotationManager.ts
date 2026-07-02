import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TEdge, TMath, TPoint, TShape, TStroke, TText } from "@/symbol"
import { cloneSymbol, EdgeKind, ShapeKind } from "@/symbol"
import { EdgeOps } from "@/symbol/edge/Edge"
import { BoxOps } from "@/symbol/primitives/Box"
import { type TOBB } from "@/symbol/primitives/OBB"
import { ShapeOps } from "@/symbol/shape/Shape"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import { MatrixTransform } from "@/transform"
import { computeAngleRadian, convertDegreeToRadian, convertRadianToDegree, TWO_PI } from "@/utils"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IIRotationManager extends IIAbstractTransformManager {
  protected managerName = "IIRotationManager"
  protected transformName = "rotate"
  center!: TPoint
  origin!: TPoint

  constructor(editor: TInteractiveInkEditor) {
    super(editor)
  }

  protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke {
    if (stroke.isSolverOutput) {
      this.logger.warn("applyToStroke", "Skipping solver output stroke - it will be recalculated", stroke.id)
      return stroke
    }
    this.applyMatrixToPoints(stroke.pointers, matrix)
    StrokeOps.updateBounds(stroke)
    return stroke
  }

  protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape {
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        shape.center = matrix.applyToPoint(shape.center)
        shape.orientation = (shape.orientation + MatrixTransform.rotation(matrix)) % TWO_PI
        ShapeOps.updateShapeDerivedFields(shape)
        return shape
      }
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
        throw new Error(`Can't apply rotate on shape, kind unknown: ${JSON.stringify(shape)}`)
    }
  }

  protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.phi = (edge.phi - MatrixTransform.rotation(matrix)) % TWO_PI
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
        edge.points = edge.points.map((p) => matrix.applyToPoint(p))
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
      default:
        throw new Error(`Can't apply rotate on edge, kind unknown: ${JSON.stringify(edge)}`)
    }
  }

  protected applyOnText(text: TText, matrix: MatrixTransform): TText {
    text.rotation = {
      degree: convertRadianToDegree(MatrixTransform.rotation(matrix)) + (text.rotation?.degree || 0),
      center: this.center,
    }
    return this.editor.typeset.updateBounds(text)
  }

  protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath {
    math.rotation = {
      degree: convertRadianToDegree(MatrixTransform.rotation(matrix)) + (math.rotation?.degree || 0),
      center: this.center,
    }
    return math
  }

  rotateElement(id: string, degree: number): void {
    this.logger.info("rotateElement", {
      id,
      degree,
    })
    this.editor.renderer.setAttribute(id, "transform", `rotate(${degree})`)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { target })
    this.interactElementsGroup = this.resolveInteractGroup(target)
    const boundingBox = BoxOps.createFromPoints(this.model.symbolsSelected.flatMap((s) => s.vertices))

    this.center = {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2,
    }
    this.origin = origin
    this.setTransformOrigin(this.interactElementsGroup.id, this.center.x, this.center.y)
    this.model.symbolsSelected.forEach((s) => {
      this.setTransformOrigin(s.id, this.center.x, this.center.y)
    })
    this.clearResultStrokesForSelectedMath()
  }

  continue(point: TPoint): number {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = Math.round(convertRadianToDegree(computeAngleRadian(this.origin, this.center, point)))

    angleDegree = this.editor.snaps.snapRotation(angleDegree)

    if (point.x - this.center.x < 0) {
      angleDegree = 360 - angleDegree
    }

    this.rotateElement(this.interactElementsGroup.id, angleDegree)
    this.model.symbolsSelected.forEach((s) => {
      this.rotateElement(s.id, angleDegree)
    })
    const angleRad = convertDegreeToRadian(angleDegree)
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)
    this.editor.connector.drawAnchoredEdgesForMatrix(
      this.model.symbolsSelected.map((s) => s.id),
      matrix
    )
    return angleDegree
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    const angleDegree = this.continue(point)
    const angleRad = convertDegreeToRadian(angleDegree) % TWO_PI
    const oldSymbols = this.model.symbolsSelected.map((s) => cloneSymbol(s))
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)
    const preTransformBoundsById = new Map<string, TOBB>()
    this.model.symbolsSelected.forEach((s) => {
      const bounds = (s as unknown as { bounds?: TOBB }).bounds
      if (bounds) {
        preTransformBoundsById.set(s.id, {
          ...bounds,
          center: { ...bounds.center },
        })
      }
    })
    this.applyAndDraw(this.model.symbolsSelected, matrix)
    this.editor.connector.updateAnchoredEdges(
      this.model.symbolsSelected.map((s) => s.id),
      matrix,
      preTransformBoundsById
    )
    const strokesFromSymbols = this.editor.extractStrokesFromSymbols(this.model.symbolsSelected)
    await this.editor.recognizer.transformRotate(
      strokesFromSymbols.map((s) => s.id),
      angleRad,
      this.center.x,
      this.center.y
    )
    this.editor.history.push(this.model, {
      rotate: [
        {
          symbols: oldSymbols,
          angle: angleRad,
          center: { ...this.center },
        },
      ],
    })
    this.finalizeTransform()
  }
}
