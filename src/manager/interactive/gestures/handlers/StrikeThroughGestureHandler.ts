import type { TInteractiveInkCanvas } from "@/canvas"
import type { TStroke } from "@/symbol"
import { DecoratorKind } from "@/symbol"

import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"
import type { TGesture } from "../GestureTypes"
import { StrikeThroughAction } from "../GestureTypes"
/**
 * Handler for STRIKETHROUGH gesture type
 * Supports two actions: Draw (apply decorator) and Erase (remove symbols)
 * @group Manager
 */
export class StrikeThroughGestureHandler extends GestureHandler {
  readonly gestureType = "STRIKETHROUGH" as const

  constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(canvas, helpers)
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyStrikeThroughGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.logger.warn("applyStrikeThroughGesture", "Unable to apply strikethrough because there are no strokes")
      return
    }

    switch (this.manager.strikeThroughAction) {
      case StrikeThroughAction.Draw: {
        const changes = await this.processor.apply(gesture.strokeIds, {
          kind: "decorator",
          decoratorKind: DecoratorKind.Strikethrough,
        })
        if (changes) {
          this.history.push(changes)
        }
        break
      }
      case StrikeThroughAction.Erase:
        await this.processor.apply(gesture.strokeIds, { kind: "erase" })
        break
      default:
        this.logger.warn(
          "applyStrikeThroughGesture",
          `Unknown strikeThroughAction: ${this.manager.strikeThroughAction}`
        )
        break
    }
  }
}
