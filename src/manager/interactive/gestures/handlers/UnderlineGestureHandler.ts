import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import { UnderlineAction } from "@/manager/interactive/gestures/GestureTypes"
import type { TStroke } from "@/symbol"
import { DecoratorKind } from "@/symbol"

/**
 * Handler for UNDERLINE gesture type
 * Supports two actions: Draw (apply decorator) and Thicken (increase stroke width)
 * @group Manager
 */
export class UnderlineGestureHandler extends GestureHandler {
  readonly gestureType = "UNDERLINE" as const

  constructor(editor: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(editor, helpers)
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyUnderlineGesture", {
      gestureStroke,
      gesture,
    })
    if (!gesture.strokeIds.length) {
      this.logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }

    switch (this.manager.underlineAction) {
      case UnderlineAction.Draw: {
        const changes = await this.processor.apply(gesture.strokeIds, {
          kind: "decorator",
          decoratorKind: DecoratorKind.Underline,
        })
        if (changes) {
          this.history.push(this.model, changes)
        }
        break
      }
      case UnderlineAction.Thicken: {
        const changes = await this.processor.apply(gesture.strokeIds, { kind: "thicken", factor: 2 })
        if (changes) {
          this.history.push(this.model, changes)
        }
        break
      }
      default:
        this.logger.warn("applyUnderlineGesture", `Unknown underlineAction: ${this.manager.underlineAction}`)
        break
    }
  }
}
