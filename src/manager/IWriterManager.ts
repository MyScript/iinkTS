import { InkEditor } from "../editor";
import { PointerInfo } from "../grabber";
import { IModel } from "../model";
import { TStyle } from "../style";
import { IIStroke, SymbolType, TIISymbol, TPointer } from "../symbol";
import { DeferredPromise } from "../utils";
import { AbstractWriterManager } from "./AbstractWriterManager";

export class IWriterManager extends AbstractWriterManager {
  editor: InkEditor
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(editor: InkEditor) {
    super(editor)
    this.editor = editor
  }

  get model(): IModel {
    return this.editor.model
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol {
    this.model.currentStroke = new IIStroke(style, pointerType)
    this.model.currentStroke.addPointer(pointer)
    return this.model.currentStroke
  }

  protected updateCurrentSymbol(pointer: TPointer): IIStroke {
    if (this.model.currentStroke?.type === SymbolType.Stroke) {
      this.model.currentStroke.addPointer(pointer)
    }
    return this.model.currentStroke!
  }

  async end(info: PointerInfo): Promise<void> {
    const localPointer = info.pointer
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentStroke = undefined
    this.editor.history.push(this.model, { added: [localSymbol] })
    this.renderer.drawSymbol(localSymbol!)
    this.model.addStroke(localSymbol)
    const deferred = new DeferredPromise<void>()

    if (this.editor.configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      const currentModel = this.model.clone()
      this.#exportTimer = setTimeout(async () => {
        try {

          const exports = await this.editor.recognizer.send(this.model.strokes as IIStroke[])
          this.model.mergeExport(exports)
          this.editor.history.updateModelStack(currentModel)
          this.editor.event.emitExported(this.model.exports || {})

          deferred.resolve()
        } catch (error) {
          this.editor.logger.error("updateModelRendering", { error })
          this.editor.event.emitError(error as Error)
          deferred.reject(error as Error)
        }
      }, this.editor.configuration.triggers.exportContent === "QUIET_PERIOD" ? this.editor.configuration.triggers.exportContentDelay : 0)
    } else {
      deferred.resolve()
    }
    return deferred.promise

  }
}
