import { InkEditor } from "../editor";
import { PointerInfo } from "../grabber";
import { IModel } from "../model";
import { TStyle } from "../style";
import { IIStroke, SymbolType, TIISymbol, TPointer } from "../symbol";
import { AbstractWriterManager } from "./AbstractWriterManager";

export class IWriterManager extends AbstractWriterManager {
  editor: InkEditor

  constructor(editor: InkEditor) {
    super(editor)
    this.editor = editor
  }

  get model(): IModel
  {
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

    this.renderer.drawSymbol(localSymbol!)
    this.model.addStroke(localSymbol)
    if (localSymbol.type === SymbolType.Stroke) {
      const exports = await this.editor.recognizer.send(this.model.strokes as IIStroke[])
      this.model.mergeExport(exports)
    }
    this.editor.history.push(this.model, {added: [localSymbol]})

    if (this.model.exports) {
      this.editor.event.emitExported(this.model.exports)
    }
  }
}
