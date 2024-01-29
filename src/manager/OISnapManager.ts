import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { TPoint } from "../primitive"
import { OISVGRenderer } from "../renderer"
import { computeDistance } from "../utils"

export type OISnapInfo = {
  origin: TPoint,
  target: TPoint,
  distance: number,
}

/**
 * @group Manager
 */
export class OISnapManager
{
  #logger = LoggerManager.getLogger(LoggerClass.CONVERTER)
  behaviors: OIBehaviors
  snapToGrid: boolean
  snapToElement: boolean

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
    this.snapToElement = true
    this.snapToGrid = true
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get snapPoints(): TPoint[]
  {
    return this.model.symbolsSelected.flatMap(s => s.snapPoints)
  }

  protected getNearestVeticalGuide(x: number): number
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

  getPointToSnap(point: TPoint): TPoint
  {
    const pointToSnap = point
    console.log('pointToSnap: ', pointToSnap.x, pointToSnap.y)
    if (this.snapToGrid) {
      const gridSnapInfos: OISnapInfo[] = this.snapPoints.map(sp =>
      {
        const target = {
          x: this.getNearestVeticalGuide(sp.x),
          y: this.getNearestHorizontalGuide(sp.y)
        }
        return {
          origin: sp,
          target,
          distance: computeDistance(sp, target)
        }
      })
      const nearestGridPoint = gridSnapInfos.reduce((g1, g2) => g1.distance < g2.distance ? g1 : g2)

      pointToSnap.x = point.x + nearestGridPoint.target.x - nearestGridPoint.origin.x
      pointToSnap.y = point.y + nearestGridPoint.target.y - nearestGridPoint.origin.y
    }

    console.log('pointToSnap: ', pointToSnap.x, pointToSnap.y)
    return pointToSnap

  }
}
