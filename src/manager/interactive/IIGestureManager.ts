import type { TInteractiveInkCanvas } from "@/canvas"
import type { TRecognitionGesture } from "@/client"
import type { TPartialDeep } from "@/core"
import { isBetween, OBBOps } from "@/core"
import type { IIHistoryManager } from "@/history"
import { LoggerCategory } from "@/logger"
import type { TStroke } from "@/symbol"
import { isDecorator, isStroke, SymbolType } from "@/symbol"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import type { IITranslateManager, IITypesetManager } from "."
import type { TGestureHandler } from "./gestures"
import {
  GestureHelpers,
  InsertGestureHandler,
  JoinGestureHandler,
  ScratchGestureHandler,
  StrikeThroughGestureHandler,
  SurroundGestureHandler,
  UnderlineGestureHandler,
} from "./gestures"
import type { TGesture, TGestureConfiguration, TGestureType } from "./gestures/GestureTypes"
import {
  DefaultGestureConfiguration,
  InsertAction,
  JoinAction,
  StrikeThroughAction,
  SurroundAction,
  UnderlineAction,
} from "./gestures/GestureTypes"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 * @remarks Orchestrator for gesture recognition and handling using Strategy Pattern
 */
export class IIGestureManager extends IIAbstractManager {
  protected managerName = "IIGestureManager"

  #handlers: Map<TGestureType, TGestureHandler> = new Map()
  #helpers: GestureHelpers

  static readonly #TEXT_STROKE_GROUP_TYPES = new Set([SymbolType.Text, SymbolType.Stroke])
  // Thicken also bolds a math block; a decorator has no place on one
  static readonly #THICKEN_TYPES = new Set([SymbolType.Text, SymbolType.Stroke, SymbolType.Math])
  static readonly #SURROUND_SELECT_TYPES = new Set([SymbolType.Stroke, SymbolType.Text])
  static readonly #ERASE_OVERLAY_TYPES = new Set([SymbolType.Stroke, SymbolType.Text])
  static readonly #ERASE_CONTAIN_TYPES = new Set([SymbolType.Shape, SymbolType.Edge])
  static readonly #RECOGNITION_GESTURES: Record<TGestureType, TRecognitionGesture> = {
    UNDERLINE: "underline",
    SCRATCH: "scratch-out",
    JOIN: "join",
    INSERT: "insert",
    STRIKETHROUGH: "strike-through",
    SURROUND: "surround",
  }

  insertAction: InsertAction = InsertAction.LineBreak
  surroundAction: SurroundAction = SurroundAction.Select
  strikeThroughAction: StrikeThroughAction = StrikeThroughAction.Draw
  underlineAction: UnderlineAction = UnderlineAction.Draw
  joinAction: JoinAction = JoinAction.Join

  constructor(canvas: TInteractiveInkCanvas, gestureAction?: TPartialDeep<TGestureConfiguration>) {
    super(canvas, LoggerCategory.GESTURE)
    this.logger.info("constructor")
    this.surroundAction = gestureAction?.surround || DefaultGestureConfiguration.surround
    this.strikeThroughAction = gestureAction?.strikeThrough || DefaultGestureConfiguration.strikeThrough
    this.underlineAction = gestureAction?.underline || DefaultGestureConfiguration.underline
    this.insertAction = gestureAction?.insert || DefaultGestureConfiguration.insert
    this.joinAction = gestureAction?.join || DefaultGestureConfiguration.join

    // Initialize helpers with reference to this manager and register handlers
    this.#helpers = new GestureHelpers(canvas)
    this.#registerHandlers()

    // Server-detected gestures (from addStrokes) arrive asynchronously with no link to the
    // original write call — handled here instead of by the caller.
    this.client.event.addGestureDetectedListener((gesture) => this.apply(gesture))
  }

  /**
   * Register all gesture handlers using Strategy Pattern
   * @private
   */
  #registerHandlers(): void {
    this.#handlers.set("SURROUND", new SurroundGestureHandler(this.canvas, this.#helpers))
    this.#handlers.set("STRIKETHROUGH", new StrikeThroughGestureHandler(this.canvas, this.#helpers))
    this.#handlers.set("UNDERLINE", new UnderlineGestureHandler(this.canvas, this.#helpers))
    this.#handlers.set("SCRATCH", new ScratchGestureHandler(this.canvas, this.#helpers))
    this.#handlers.set("JOIN", new JoinGestureHandler(this.canvas, this.#helpers))
    this.#handlers.set("INSERT", new InsertGestureHandler(this.canvas, this.#helpers))
  }

  get translator(): IITranslateManager {
    return this.canvas.transform.translate
  }

  get typeset(): IITypesetManager {
    return this.canvas.typeset
  }

  get history(): IIHistoryManager {
    return this.canvas.history
  }

  /**
   * Apply a detected gesture using the appropriate handler.
   * @param gesture - The detected gesture with metadata; the triggering stroke is looked up
   * from the model via `gesture.gestureStrokeId` (works whether the gesture was detected
   * client-side/contextless or arrived asynchronously from the server).
   */
  async apply(gesture: TGesture): Promise<void> {
    return this.canvas.trackOperation("Applying gesture", async () => this.#applyInternal(gesture))
  }

  async #applyInternal(gesture: TGesture): Promise<void> {
    this.logger.info("apply", { gesture })

    const gestureSymbol = this.model.getSymbol(gesture.gestureStrokeId)
    if (!gestureSymbol || !isStroke(gestureSymbol)) {
      this.logger.warn("apply", `Gesture stroke not found in model: ${gesture.gestureStrokeId}`)
      return
    }
    const gestureStroke: TStroke = gestureSymbol

    // Removes the "stroke added" history entry pushed for the gesture stroke itself —
    // the handler below pushes its own entry for the gesture's actual effect instead.
    this.history.pop()
    this.canvas.removeSymbol(gestureStroke.id, false)

    // Dispatch to appropriate handler
    const handler = this.#handlers.get(gesture.gestureType)
    if (handler) {
      await handler.apply(gestureStroke, gesture)
    } else {
      this.logger.warn("apply", `No handler found for gesture type: ${gesture.gestureType}`)
    }

    // Emit event and update UI
    this.canvas.event.emitGestured({
      gestureType: gesture.gestureType,
      stroke: gestureStroke,
    })
    this.canvas.overlays.apply()
    return Promise.resolve()
  }

  /**
   * Detect gesture type from a stroke using contextless recognition
   * @param gestureStroke - The stroke to analyze
   * @returns The detected gesture or undefined
   */
  async getGestureFromContextLess(gestureStroke: TStroke): Promise<TGesture | undefined> {
    return this.canvas.trackOperation("Applying gesture", async () => {
      const gesture = await this.#getGestureFromContextLessInternal(gestureStroke)
      return gesture && this.isGestureEnabled(gesture.gestureType) ? gesture : undefined
    })
  }

  /**
   * Whether a gesture is listed in the recognition configuration's `raw-content.gestures`.
   * The server only detects the listed ones; the contextless path must honor the same list,
   * or a gesture turned off would still be applied next to typeset content.
   */
  isGestureEnabled(gestureType: TGestureType): boolean {
    const gestures = this.canvas.configuration.recognition["raw-content"]?.gestures ?? []
    return gestures.includes(IIGestureManager.#RECOGNITION_GESTURES[gestureType])
  }

  async #getGestureFromContextLessInternal(gestureStroke: TStroke): Promise<TGesture | undefined> {
    const gesture = await this.client.recognizeGesture(gestureStroke)
    if (!gesture) {
      return
    }
    // Computed once: `gestureStroke` is an unfrozen working copy (see `interactWithBackend`'s
    // `cloneSymbol`), so `SymbolGeometry.boundsOf` never caches it — calling it from inside the
    // `.some`/`.filter` predicates below, once per candidate symbol, would recompute it that many
    // times over.
    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)
    switch (gesture.gestureType) {
      case "surround": {
        // Scans every symbol in the document regardless of type, so an integrator's custom symbol
        // type missing its util must not abort gesture recognition for the whole stroke — skip it
        // like a non-candidate instead of throwing.
        const hasSymbolsToSurrond = this.model.symbols.some((s) => {
          if (
            s.id !== gestureStroke.id &&
            !isDecorator(s) &&
            symbolRegistry.has(s.type) &&
            OBBOps.contains(gestureBounds, SymbolGeometry.boundsOf(s))
          ) {
            return this.surroundAction === SurroundAction.Select || IIGestureManager.#SURROUND_SELECT_TYPES.has(s.type)
          }
          return false
        })
        if (hasSymbolsToSurrond) {
          return {
            gestureType: "SURROUND",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "left-right":
      case "right-left": {
        const underlineTypes =
          this.underlineAction === UnderlineAction.Thicken
            ? IIGestureManager.#THICKEN_TYPES
            : IIGestureManager.#TEXT_STROKE_GROUP_TYPES
        const symbolsToUnderline = this.model.symbols.filter((s) => {
          if (s.id === gestureStroke.id || !underlineTypes.has(s.type)) {
            return false
          }
          const sBounds = SymbolGeometry.boundsOf(s)
          return (
            isBetween(
              sBounds.center.x,
              gestureBounds.center.x - gestureBounds.width / 2,
              gestureBounds.center.x + gestureBounds.width / 2
            ) &&
            isBetween(
              gestureBounds.center.y,
              sBounds.center.y + sBounds.height / 4,
              sBounds.center.y + (sBounds.height * 3) / 4
            )
          )
        })
        if (symbolsToUnderline.length) {
          return {
            gestureType: "UNDERLINE",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToUnderline.map((s) => s.id),
          }
        }
        const symbolsToStrikeThrough = this.model.symbols.filter((s) => {
          if (s.id === gestureStroke.id || !IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type)) {
            return false
          }
          const sBounds = SymbolGeometry.boundsOf(s)
          return (
            isBetween(
              sBounds.center.x,
              gestureBounds.center.x - gestureBounds.width / 2,
              gestureBounds.center.x + gestureBounds.width / 2
            ) &&
            isBetween(
              gestureBounds.center.y,
              sBounds.center.y - sBounds.height / 4,
              sBounds.center.y + sBounds.height / 4
            )
          )
        })
        if (symbolsToStrikeThrough.length) {
          return {
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToStrikeThrough.map((s) => s.id),
          }
        }
        return
      }
      case "scratch": {
        // Scans every symbol in the document regardless of type, so an integrator's custom symbol
        // type missing its util must not abort gesture recognition for the whole stroke — skip it
        // like a non-candidate instead of throwing.
        const symbolsToErase = this.model.symbols.filter((s) => {
          if (s.id === gestureStroke.id || !symbolRegistry.has(s.type)) {
            return false
          }
          const sBounds = SymbolGeometry.boundsOf(s)
          return (
            (OBBOps.overlaps(gestureBounds, sBounds) && IIGestureManager.#ERASE_OVERLAY_TYPES.has(s.type)) ||
            (OBBOps.contains(gestureBounds, sBounds) && IIGestureManager.#ERASE_CONTAIN_TYPES.has(s.type))
          )
        })

        if (symbolsToErase.length) {
          return {
            gestureType: "SCRATCH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToErase.map((s) => s.id),
          }
        }
        return
      }
      case "bottom-top": {
        const hasSymbolsInRow = this.model.symbols.some(
          (s) =>
            s.id !== gestureStroke.id &&
            IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
            isBetween(
              SymbolGeometry.boundsOf(s).center.y,
              gestureBounds.center.y - gestureBounds.height / 2,
              gestureBounds.center.y + gestureBounds.height / 2
            )
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "JOIN",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "top-bottom": {
        const hasSymbolsInRow = this.model.symbols.some(
          (s) =>
            s.id !== gestureStroke.id &&
            IIGestureManager.#TEXT_STROKE_GROUP_TYPES.has(s.type) &&
            isBetween(
              SymbolGeometry.boundsOf(s).center.y,
              gestureBounds.center.y - gestureBounds.height / 2,
              gestureBounds.center.y + gestureBounds.height / 2
            )
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "INSERT",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "none":
      default:
        return
    }
  }
}
