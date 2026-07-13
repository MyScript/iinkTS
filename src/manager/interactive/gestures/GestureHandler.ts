import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { WebSocketClient } from "@/client"
import type { IIHistoryManager } from "@/history"
import { type Logger, LoggerCategory, LoggerManager } from "@/logger"
import type { TGesture, TGestureType } from "@/manager/interactive/gestures/GestureTypes"
import type { IITypesetManager } from "@/manager/interactive/IITypesetManager"
import type { IITranslateManager } from "@/manager/interactive/transform/IITranslateManager"
import type { IIModel } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { TStroke, TSymbol } from "@/symbol"

import type { IIGestureManager } from "../IIGestureManager"
import { IIGestureAnnotationProcessor } from "./GestureAnnotation"
import type { GestureHelpers } from "./GestureHelpers"

/**
 * Base interface for gesture handlers
 * Each handler is responsible for applying a specific gesture type
 * @group Manager
 */
export type TGestureHandler = {
  /**
   * The type of gesture this handler manages
   */
  readonly gestureType: TGestureType

  /**
   * Apply the gesture to the model
   * @param gestureStroke - The stroke that forms the gesture
   * @param gesture - The detected gesture information
   * @returns Promise that resolves when the gesture is applied
   */
  apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>
}

/**
 * Abstract base class for gesture handlers
 * Provides common functionality and access to canvas services via helpers
 * @group Manager
 */
export abstract class GestureHandler implements TGestureHandler {
  protected readonly logger: Logger
  protected readonly processor: IIGestureAnnotationProcessor

  constructor(
    protected canvas: TInteractiveInkCanvas,
    protected helpers: GestureHelpers
  ) {
    this.logger = LoggerManager.getLogger(LoggerCategory.GESTURE)
    this.processor = new IIGestureAnnotationProcessor(canvas)
  }

  abstract readonly gestureType: TGestureType
  abstract apply(gestureStroke: TStroke, gesture: TGesture): Promise<void | TSymbol[]>

  /**
   * Get the canvas's model
   */
  protected get model(): IIModel {
    return this.canvas.model
  }
  /**
   * Get the canvas's model
   */
  protected get manager(): IIGestureManager {
    return this.canvas.gesture
  }

  /**
   * Get the canvas's renderer
   */
  protected get renderer(): SVGRenderer {
    return this.canvas.renderer
  }

  /**
   * Get the canvas's history manager
   */
  protected get history(): IIHistoryManager {
    return this.canvas.history
  }

  /**
   * Get the canvas's client
   */
  protected get client(): WebSocketClient {
    return this.canvas.client
  }

  /**
   * Get the canvas's translator manager
   */
  protected get translator(): IITranslateManager {
    return this.canvas.transform.translate
  }

  /**
   * Get the canvas's typeset manager
   */
  protected get typeset(): IITypesetManager {
    return this.canvas.typeset
  }

  /**
   * Get the row height from configuration
   */
  protected get rowHeight(): number {
    return this.canvas.configuration.rendering.guides.gap
  }

  private getSymbolRowIndex(symbol: TSymbol): number {
    // Use symbol bounds yMid for row calculation
    return Math.round(symbol.bounds.center.y / this.rowHeight)
  }

  protected isSymbolAbove(source: TSymbol, target: TSymbol): boolean {
    return this.getSymbolRowIndex(source) > this.getSymbolRowIndex(target)
  }

  protected isSymbolInRow(source: TSymbol, target: TSymbol): boolean {
    return this.getSymbolRowIndex(source) === this.getSymbolRowIndex(target)
  }

  protected isSymbolBelow(source: TSymbol, target: TSymbol): boolean {
    return this.getSymbolRowIndex(source) < this.getSymbolRowIndex(target)
  }

  protected getFirstSymbol(symbols: TSymbol[]): TSymbol | undefined {
    if (!symbols.length) {
      return
    }
    return symbols.reduce((previous, current) => {
      if (previous) {
        if (this.getSymbolRowIndex(previous) < this.getSymbolRowIndex(current)) {
          return previous
        } else if (
          this.getSymbolRowIndex(previous) == this.getSymbolRowIndex(current) &&
          previous.bounds.center.x < current.bounds.center.x
        ) {
          return previous
        }
      }
      return current
    })
  }

  protected getLastSymbol(symbols: TSymbol[]): TSymbol | undefined {
    if (!symbols.length) {
      return
    }
    return symbols.reduce((previous, current) => {
      if (previous) {
        if (this.getSymbolRowIndex(previous) > this.getSymbolRowIndex(current)) {
          return previous
        }
        if (this.getSymbolRowIndex(previous) < this.getSymbolRowIndex(current)) {
          return current
        } else if (previous.bounds.center.x > current.bounds.center.x) {
          return previous
        }
      }
      return current
    })
  }

  /**
   * Get the stroke space width from configuration
   */
  protected get strokeSpaceWidth(): number {
    return this.canvas.configuration.rendering.guides.gap * 2
  }
}
