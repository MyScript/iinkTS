import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { LoggerCategory } from "@/logger"

import { IIAbstractManager } from "./IIAbstractManager"
import { IIResizeManager } from "./transform/IIResizeManager"
import { IIRotationManager } from "./transform/IIRotationManager"
import { IITranslateManager } from "./transform/IITranslateManager"

/**
 * Orchestrates the three transform sub-managers (translate, resize, rotation).
 * Access via canvas.transform.translate / .resize / .rotation
 * @group Manager
 */
export class IITransformManager extends IIAbstractManager {
  protected managerName = "IITransformManager"

  readonly translate: IITranslateManager
  readonly resize: IIResizeManager
  readonly rotation: IIRotationManager

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.TRANSFORMER)
    this.translate = new IITranslateManager(canvas)
    this.resize = new IIResizeManager(canvas)
    this.rotation = new IIRotationManager(canvas)
  }
}
