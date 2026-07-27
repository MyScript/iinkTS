import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import { StrikeThroughAction } from "@/manager/interactive/gestures/GestureTypes"
import type { TStroke } from "@/symbol"
import { DecoratorKind } from "@/symbol"

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
          this.history.push(this.model, changes)
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
