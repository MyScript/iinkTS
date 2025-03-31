import { LoggerCategory, LoggerManager } from "../logger"
import { IIStroke } from "../symbol"
import { TExportV2 } from "./ExportV2"

/**
 * @group Model
 */
export class IModel
{
  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  readonly creationTime: number
  modificationDate: number
  currentStroke?: IIStroke
  strokes: IIStroke[]
  exports?: TExportV2
  converts?: TExportV2
  width: number
  height: number
  rowHeight: number
  idle: boolean

  constructor(width = 100, height = 100, rowHeight = 0, creationDate = Date.now())
  {
    this.creationTime = creationDate
    this.modificationDate = creationDate
    this.width = width
    this.height = height
    this.rowHeight = rowHeight
    this.strokes = []
    this.exports = undefined
    this.converts = undefined
    this.idle = true
  }

  addStroke(stroke: IIStroke): void
  {
    this.#logger.info("addStroke", { stroke })
    const sIndex = this.strokes.findIndex(s => s.id === stroke.id)
    if (sIndex > -1) {
      throw new Error(`Stroke id already exist: ${ stroke.id }`)
    }
    this.strokes.push(stroke)
    this.modificationDate = Date.now()
    this.converts = undefined
    this.exports = undefined
    this.#logger.debug("addStroke", this.strokes)
  }

  updateStroke(updatedStroke: IIStroke): void
  {
    this.#logger.info("updateStroke", { updatedStroke })
    const sIndex = this.strokes.findIndex(s => s.id === updatedStroke.id)
    if (sIndex !== -1) {
      updatedStroke.modificationDate = Date.now()
      this.strokes.splice(sIndex, 1, updatedStroke)
      this.modificationDate = Date.now()
      this.converts = undefined
      this.exports = undefined
    }
    this.#logger.debug("updateStroke", this.strokes)
  }

  extractDifferenceStrokes(model: IModel): { added: IIStroke[], removed: IIStroke[] }
  {
    return {
      added: this.strokes.filter(s1 => model.strokes.findIndex(s2 => s1.id === s2.id && s1.modificationDate === s2.modificationDate) === -1),
      removed: model.strokes.filter(s1 => this.strokes.findIndex(s2 => s1.id === s2.id && s1.modificationDate === s2.modificationDate) === -1)
    }
  }

  mergeExport(exports: TExportV2)
  {
    this.#logger.info("mergeExport", { exports })
    if (this.exports) {
      Object.assign(this.exports, exports)
    } else {
      this.exports = exports
    }
    this.#logger.debug("mergeExport", this.exports)
  }

  clone(): IModel
  {
    this.#logger.info("clone")
    const clonedModel = new IModel(this.width, this.height, this.rowHeight, this.creationTime)
    clonedModel.modificationDate = this.modificationDate
    clonedModel.strokes = this.strokes.map(s =>
    {
      const c = s.clone()
      c.selected = false
      return c
    })
    clonedModel.exports = structuredClone(this.exports)
    clonedModel.idle = this.idle
    this.#logger.debug("clone", { clonedModel })
    return clonedModel
  }

  clear(): void
  {
    this.#logger.info("clear")
    this.modificationDate = Date.now()
    this.strokes = []
    this.exports = undefined
    this.converts = undefined
    this.currentStroke = undefined
    this.idle = true

  }
}
