import { LoggerCategory, LoggerManager } from "@/logger"
import type { TStroke } from "@/symbol"

import type { TExportV2 } from "./ExportV2"

/**
 * @group Model
 */
export class IModel {
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  readonly creationTime: number
  modificationDate: number
  currentStroke?: TStroke
  strokes: TStroke[]
  exports?: TExportV2
  converts?: TExportV2
  width: number
  height: number
  rowHeight: number

  constructor(width = 100, height = 100, rowHeight = 0, creationDate = Date.now()) {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.rowHeight = rowHeight
    this.strokes = []
    this.exports = undefined
    this.converts = undefined
  }

  addStroke(stroke: TStroke): void {
    this.#logger.info("addStroke", { stroke })
    const sIndex = this.strokes.findIndex((s) => s.id === stroke.id)
    if (sIndex > -1) {
      throw new Error(`Stroke id already exist: ${stroke.id}`)
    }
    this.strokes.push(stroke)
    this.modificationDate = Date.now()
    this.converts = undefined
    this.exports = undefined
    this.#logger.debug("addStroke", this.strokes)
  }

  updateStroke(updatedStroke: TStroke): void {
    this.#logger.info("updateStroke", {
      updatedStroke,
    })
    const sIndex = this.strokes.findIndex((s) => s.id === updatedStroke.id)
    if (sIndex !== -1) {
      updatedStroke.modificationDate = Date.now()
      this.strokes.splice(sIndex, 1, updatedStroke)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("updateStroke", this.strokes)
  }

  removeStroke(id: string): void {
    this.#logger.info("removeSymbol", { id })
    const strokeIndex = this.strokes.findIndex((s) => s.id === id)
    if (strokeIndex !== -1) {
      this.strokes.splice(strokeIndex, 1)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("removeSymbol", this.strokes)
  }

  extractDifferenceStrokes(model: IModel): {
    added: TStroke[]
    removed: TStroke[]
  } {
    const modelStrokeKeys = new Set(model.strokes.map((s) => `${s.id}-${s.modificationDate}`))
    const thisStrokeKeys = new Set(this.strokes.map((s) => `${s.id}-${s.modificationDate}`))

    return {
      added: this.strokes.filter((s) => !modelStrokeKeys.has(`${s.id}-${s.modificationDate}`)),
      removed: model.strokes.filter((s) => !thisStrokeKeys.has(`${s.id}-${s.modificationDate}`)),
    }
  }

  mergeExport(exports: TExportV2) {
    this.#logger.info("mergeExport", { exports })
    if (this.exports) {
      Object.assign(this.exports, exports)
    } else {
      this.exports = exports
    }
    this.#logger.debug("mergeExport", this.exports)
  }

  clone(): IModel {
    this.#logger.info("clone")
    const clonedModel = new IModel(this.width, this.height, this.rowHeight, this.creationTime)
    clonedModel.modificationDate = this.modificationDate
    clonedModel.strokes = this.strokes.map((s) => structuredClone(s))
    clonedModel.exports = structuredClone(this.exports)
    this.#logger.debug("clone", { clonedModel })
    return clonedModel
  }

  clear(): void {
    this.#logger.info("clear")
    this.modificationDate = Date.now()
    this.strokes = []
    this.exports = undefined
    this.converts = undefined
    this.currentStroke = undefined
  }
}
