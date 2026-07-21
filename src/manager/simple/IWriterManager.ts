import type { InkCanvas } from "@/canvas"
import type { TPointerInfo } from "@/grabber"
import { AbstractWriterManager } from "@/manager/base/AbstractWriterManager"
import type { IModel } from "@/model"
import type { TStyle } from "@/style"
import type { TPointer, TStroke, TSymbol } from "@/symbol"
import { isStroke } from "@/symbol"
import { StrokeOps } from "@/symbol/stroke/Stroke"

/**
 * @group Manager
 */
export class IWriterManager extends AbstractWriterManager {
  canvas: InkCanvas
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(canvas: InkCanvas) {
    super(canvas)
    this.canvas = canvas
  }

  get model(): IModel {
    return this.canvas.model
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol {
    this.model.currentStroke = StrokeOps.create(style, pointerType)
    StrokeOps.addPointer(this.model.currentStroke, pointer)
    return this.model.currentStroke
  }

  protected updateCurrentSymbol(pointer: TPointer): TStroke {
    if (this.model.currentStroke && isStroke(this.model.currentStroke)) {
      StrokeOps.addPointer(this.model.currentStroke, pointer)
    }
    return this.model.currentStroke!
  }

  async end(info: TPointerInfo): Promise<void> {
    const localPointer = info.pointer
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentStroke = undefined
    this.renderer.drawSymbol(localSymbol)
    this.model.addStroke(localSymbol)
    this.canvas.history.push(this.model, {
      added: [localSymbol],
    })
    if (this.canvas.configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      this.#exportTimer = setTimeout(
        async () => {
          this.canvas.export()
        },
        this.canvas.configuration.triggers.exportContent === "QUIET_PERIOD"
          ? this.canvas.configuration.triggers.exportContentDelay
          : 0
      )
    }
  }
}
