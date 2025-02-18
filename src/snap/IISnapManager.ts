import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import { Box, TPoint, TSegment } from "../symbol"
import { IISVGRenderer } from "../renderer"
import { IISVGRendererConst } from "../renderer/svg/IISVGRendererConst"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PartialDeep } from "../utils"
import { SnapConfiguration, TSnapConfiguration } from "./IISnapConfiguration"

/**
 * @group Snap
 */
export type TSnapNudge = TPoint

/**
 * @group Snap
 */
export type TSnapLineInfos = {
  nudge: TSnapNudge,
  verticales: TSegment[]
  horizontales: TSegment[]
}

/**
 * @group Snap
 */
export class IISnapManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.CONVERTER)
  editor: InteractiveInkEditor
  configuration: SnapConfiguration

  constructor(editor: InteractiveInkEditor, config?: PartialDeep<TSnapConfiguration>)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.configuration = new SnapConfiguration(config)
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): IISVGRenderer
  {
    return this.editor.renderer
  }

  get selectionSnapPoints(): TPoint[]
  {
    return Box.createFromPoints(this.model.symbolsSelected.flatMap(s => s.snapPoints)).snapPoints
  }

  get otherSnapPoints(): TPoint[]
  {
    const selectSymbolIds = this.model.symbolsSelected.map(s => s.id)
    return this.model.symbols.filter(s => !selectSymbolIds.includes(s.id)).flatMap(s => s.snapPoints)
  }

  get snapThreshold(): number
  {
    return this.editor.configuration.rendering.guides.gap / 2
  }

  protected getNearestVerticalGuide(x: number): number
  {
    if (this.renderer.verticalGuides.length) {
      return this.renderer.verticalGuides.reduce((prev, curr) =>
      {
        return (Math.abs(curr - x) < Math.abs(prev - x) ? curr : prev)
      })
    }
    return x
  }

  protected getNearestHorizontalGuide(y: number): number
  {
    if (this.renderer.horizontalGuides.length) {
      return this.renderer.horizontalGuides.reduce((prev, curr) =>
      {
        return (Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev)
      })
    }
    return y
  }

  protected getGuidePointToSnap(point: TPoint): TPoint
  {
    return {
      x: this.getNearestVerticalGuide(point.x),
      y: this.getNearestHorizontalGuide(point.y)
    }
  }

  drawSnapToElementLines(lines: TSegment[]): void
  {
    const attrs = {
      role: "snap-to-element",
      fill: "transparent",
      stroke: "blue",
      "stroke-width": "2",
      style: IISVGRendererConst.noSelection,
      "marker-start": `url(#${ IISVGRendererConst.crossMarker })`,
      "marker-end": `url(#${ IISVGRendererConst.crossMarker })`
    }
    lines.forEach(seg =>
    {
      this.renderer.drawLine(seg.p1, seg.p2, attrs)
    })
  }

  clearSnapToElementLines(): void
  {
    this.renderer.clearElements({ attrs: { role: "snap-to-element" } })
  }

  protected getSnapLinesInfos(sourcePoints: TPoint[], targetPoints: TPoint[]): TSnapLineInfos
  {
    const infos: TSnapLineInfos = {
      nudge: {
        x: Infinity,
        y: Infinity
      },
      verticales: [],
      horizontales: [],
    }
    if (!sourcePoints.length || !targetPoints.length) return infos

    sourcePoints.forEach(p1 =>
    {
      targetPoints.forEach(p2 =>
      {
        if (this.snapThreshold > Math.abs(p2.x - p1.x)) {
          if (Math.abs(infos.nudge.x) > Math.abs(p2.x - p1.x)) {
            infos.nudge.x = p2.x - p1.x
            infos.verticales = [{ p1: { ...p1 }, p2 }]
          }
          else if (infos.nudge.x === p2.x - p1.x) {
            infos.verticales.push({ p1: { ...p1 }, p2 })
          }
        }
        if (this.snapThreshold > Math.abs(p2.y - p1.y)) {
          if (Math.abs(infos.nudge.y) > Math.abs(p2.y - p1.y)) {
            infos.nudge.y = p2.y - p1.y
            infos.horizontales = [{ p1: { ...p1 }, p2 }]
          }
          else if (infos.nudge.y === p2.y - p1.y) {
            infos.horizontales.push({ p1: { ...p1 }, p2 })
          }
        }
      })
    })

    return infos
  }

  snapResize(point: TPoint, horizontal = true, vertical = true): TPoint
  {
    this.clearSnapToElementLines()
    if (!this.configuration.symbol && !this.configuration.guide) return point

    let localPoint: TPoint = {
      x: Infinity,
      y: Infinity
    }
    if (this.configuration.guide) {
      localPoint = this.getGuidePointToSnap(point)
    }
    const snapLines: TSegment[] = []

    if (this.configuration.symbol) {
      const snapLinesInfos = this.getSnapLinesInfos([point], this.otherSnapPoints)
      if (horizontal && Math.abs(snapLinesInfos.nudge.x) <= Math.abs(point.x - localPoint.x)) {
        localPoint.x = point.x + snapLinesInfos.nudge.x
        snapLines.push(...snapLinesInfos.verticales)
      }
      if (vertical && Math.abs(snapLinesInfos.nudge.y) <= Math.abs(point.y - localPoint.y)) {
        localPoint.y = point.y + snapLinesInfos.nudge.y
        snapLines.push(...snapLinesInfos.horizontales)
      }
    }

    if (localPoint.x === Infinity) localPoint.x = point.x
    if (localPoint.y === Infinity) localPoint.y = point.y

    snapLines.forEach(s => s.p1 = localPoint)
    this.drawSnapToElementLines(snapLines)
    return localPoint
  }

  snapTranslate(tx: number, ty: number): TSnapNudge
  {
    this.clearSnapToElementLines()
    const nudge: TSnapNudge = { x: tx, y: ty }
    if (!this.configuration.symbol && !this.configuration.guide) return nudge

    const selectionSymbolPoints = this.selectionSnapPoints.map(p => ({ x: p.x + tx, y: p.y + ty }))

    let lastDeltaX = Infinity
    let lastDeltaY = Infinity

    if (this.configuration.guide) {
      selectionSymbolPoints.forEach(p =>
      {
        const gridPoint = this.getGuidePointToSnap(p)
        if (lastDeltaX > Math.abs(gridPoint.x - p.x)) {
          nudge.x = gridPoint.x - p.x + tx
          lastDeltaX = Math.abs(gridPoint.x - p.x)
        }
        if (lastDeltaY > Math.abs(gridPoint.y - p.y)) {
          nudge.y = gridPoint.y - p.y + ty
          lastDeltaY = Math.abs(gridPoint.y - p.y)
        }
      })
    }

    const snapLines: TSegment[] = []
    if (this.configuration.symbol) {
      const snapLinesInfos = this.getSnapLinesInfos(selectionSymbolPoints, this.otherSnapPoints)
      if (lastDeltaX >= Math.abs(snapLinesInfos.nudge.x) && snapLinesInfos.verticales.length) {
        nudge.x = snapLinesInfos.nudge.x + tx
        snapLines.push(...snapLinesInfos.verticales)
      }
      if (lastDeltaY >= Math.abs(snapLinesInfos.nudge.y) && snapLinesInfos.horizontales.length) {
        nudge.y = snapLinesInfos.nudge.y + ty
        snapLines.push(...snapLinesInfos.horizontales)
      }
    }
    if (snapLines.length) {
      snapLines.forEach(l =>
      {
        l.p1.x += nudge.x - tx
        l.p1.y += nudge.y - ty
      })
      this.drawSnapToElementLines(snapLines)
    }
    return nudge
  }

  snapRotation(angleDegree: number): number
  {
    if (this.configuration.angle > 0) {
      return this.configuration.angle * Math.round(angleDegree / this.configuration.angle)
    }
    return angleDegree
  }
}
