import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIEraser, SymbolType, TPointer } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { OIHistoryManager } from "../history"

/**
 * @group Manager
 */
export class OIEraseManager
{
  #logger = LoggerManager.getLogger(LoggerClass.WRITE)
  behaviors: OIBehaviors

  currentEraser?: OIEraser

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get history(): OIHistoryManager
  {
    return this.behaviors.history
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  start(pointer: TPointer): void
  {
    this.#logger.info("startErase", { pointer })
    this.currentEraser = new OIEraser()
    this.currentEraser.pointers.push(pointer)
    this.renderer.drawSymbol(this.currentEraser!)
  }

  continue(pointer: TPointer): void
  {
    this.#logger.info("continueErase", { pointer })
    if (!this.currentEraser) {
      throw new Error("Can't update current eraser because currentEraser is undefined")
    }
    this.renderer.drawSymbol(this.currentEraser!)
    this.currentEraser.pointers.push(pointer)
    this.model.setToDeleteSymbolsFromPoint(pointer)
    this.model.symbolsToDelete.map(s => this.renderer.drawSymbol(s))
  }

  async end(pointer: TPointer): Promise<void>
  {
    this.#logger.info("finishErasing", { pointer })
    this.continue(pointer)

    this.renderer.removeSymbol(this.currentEraser!.id)
    this.currentEraser = undefined
    if (this.model.symbolsToDelete.length) {
      const symbolsToDelete = this.model.symbolsToDelete.slice()
      symbolsToDelete.forEach(s =>
      {
        this.model.removeSymbol(s.id)
        this.renderer.removeSymbol(s.id)
      })
      this.history.push(this.model, { erased: symbolsToDelete })
      await this.recognizer.eraseStrokes(symbolsToDelete.filter(s => s.type === SymbolType.Stroke).map(s => s.id))
    }
  }
}
