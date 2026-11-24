import type { TInkCanvas } from "@/canvas"
import type { TPointer } from "@/core"
import type { TPointerInfo } from "@/grabber"
import type { IModel } from "@/model"
import type { TStyle } from "@/style"
import type { TStroke, TSymbol } from "@/symbol"
import { isStroke } from "@/symbol"
import { StrokeUtil } from "@/symbol-utils"

import { AbstractWriterManager } from "../base/AbstractWriterManager"

/**
 * @group Manager
 */
export class IWriterManager extends AbstractWriterManager {
  canvas: TInkCanvas
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(canvas: TInkCanvas) {
    super(canvas)
    this.canvas = canvas
  }

  get model(): IModel {
    return this.canvas.model
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string, creationTime: number): TSymbol {
    this.model.currentStroke = StrokeUtil.createEmpty(style, pointerType, creationTime)
    StrokeUtil.addPointer(this.model.currentStroke, pointer)
    return this.model.currentStroke
  }

  protected updateCurrentSymbol(pointer: TPointer): TStroke {
    if (this.model.currentStroke && isStroke(this.model.currentStroke)) {
      StrokeUtil.addPointer(this.model.currentStroke, pointer)
    }
    return this.model.currentStroke!
  }

  async end(info: TPointerInfo): Promise<void> {
    const localPointer = info.pointer
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentStroke = undefined
    this.renderer.drawSymbol(localSymbol)
    this.model.addStroke(localSymbol)
    this.canvas.history.push({
      added: [localSymbol],
    })
    if (this.canvas.configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      this.#exportTimer = setTimeout(
        async () => {
          try {
            await this.canvas.export()
          } catch (error) {
            // Not awaited before, so every failed auto-export reached the integrator as an
            // unhandled rejection. InkCanvas has no manageError, so report on the error event.
            this.canvas.event.emitError(error as Error)
          }
        },
        this.canvas.configuration.triggers.exportContent === "QUIET_PERIOD"
          ? this.canvas.configuration.triggers.exportContentDelay
          : 0
      )
    }
  }
}
