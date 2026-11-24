import type { TInteractiveInkCanvas } from "@/canvas"
import type { TStroke } from "@/symbol"
import { DecoratorKind } from "@/symbol"

import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"
import type { TGesture } from "../GestureTypes"
import { UnderlineAction } from "../GestureTypes"
/**
 * Handler for UNDERLINE gesture type
 * Supports two actions: Draw (apply decorator) and Thicken (one level up the thickness menu for a
 * stroke, the font weight menu for a text or math block, back to the first past the last)
 * @group Manager
 */
export class UnderlineGestureHandler extends GestureHandler {
  readonly gestureType = "UNDERLINE" as const

  constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(canvas, helpers)
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
          this.history.push(changes)
        }
        break
      }
      case UnderlineAction.Thicken: {
        const { thicknessList = [], fontWeightList = [] } = this.canvas.configuration.menu.style
        await this.processor.apply(gesture.strokeIds, {
          kind: "thicken",
          widths: thicknessList.map((t) => t.value),
          fontWeights: fontWeightList.map((f) => f.value).filter((w): w is "normal" | "bold" => w !== "auto"),
        })
        break
      }
      default:
        this.logger.warn("applyUnderlineGesture", `Unknown underlineAction: ${this.manager.underlineAction}`)
        break
    }
  }
}
