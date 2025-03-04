import { InkEditor } from "../editor";
import { PointerInfo } from "../grabber";
import { TStyle } from "../style";
import { IIStroke, SymbolType, TIISymbol, TPointer } from "../symbol";
import { AbstractWriteManager } from "./AbstractWriteManager";

export class IWriteManager extends AbstractWriteManager {
  editor: InkEditor

  constructor(editor: InkEditor) {
    super(editor)
    this.editor = editor
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol {
    this.model.currentSymbol = new IIStroke(style, pointerType)
    this.model.currentSymbol.addPointer(pointer)
    return this.model.currentSymbol
  }

  protected updateCurrentSymbol(pointer: TPointer): TIISymbol {
    if (this.model.currentSymbol?.type === SymbolType.Stroke) {
      this.model.currentSymbol.addPointer(pointer)
    }
    return this.model.currentSymbol!
  }

  async end(info: PointerInfo): Promise<void> {
    const localPointer = info.pointer
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentSymbol = undefined

    this.renderer.drawSymbol(localSymbol!)
    this.model.addSymbol(localSymbol)
    if (localSymbol.type === SymbolType.Stroke) {
      const exports = await this.editor.recognizer.send(this.model.symbols as IIStroke[])
      this.model.mergeExport(exports)
    }
    this.editor.history.push(this.model, {added: [localSymbol]})

    if (this.model.exports) {
      this.editor.event.emitExported(this.model.exports)
    }
  }
}
