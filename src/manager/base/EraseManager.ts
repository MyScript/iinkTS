import type { TInkCanvas, TInteractiveInkCanvas } from "@/canvas"
import type { TPoint, TSegment } from "@/core"
import { BoxOps, computeDistanceBetweenPointAndSegment, computeDistanceSquared, OBBOps, type TOBB } from "@/core"
import type { TPointerInfo } from "@/grabber"
import { PointerEventGrabber } from "@/grabber"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { SVGRenderer } from "@/renderer"
import type { TEraser, TSymbol } from "@/symbol"
import { EraserOps, isText } from "@/symbol"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"
/**
 * @group Manager
 */
export type THittable = {
  bounds: TOBB
  vertices: TPoint[]
  edges: TSegment[]
}

/**
 * @group Manager
 */
export class EraseManager {
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  canvas: TInteractiveInkCanvas | TInkCanvas

  eraserWidth = 5
  currentEraser?: TEraser
  deletingIds: Set<string>
  charsToDelete: Map<string, Set<string>> = new Map()

  constructor(canvas: TInteractiveInkCanvas | TInkCanvas) {
    this.#logger.info("constructor")
    this.canvas = canvas
    this.grabber = new PointerEventGrabber(canvas.configuration.grabber)
    this.deletingIds = new Set()
  }

  get renderer(): SVGRenderer {
    return this.canvas.renderer
  }

  #isTInteractiveInkCanvas(canvas: TInteractiveInkCanvas | TInkCanvas): canvas is TInteractiveInkCanvas {
    return "removeSymbols" in canvas && typeof canvas.removeSymbols === "function"
  }

  #isHitByPoint(symbol: TSymbol, point: TPoint, radius: number): boolean {
    // One `of()` call serves all three reads below: an unfrozen symbol (the plain-Ink branch loops
    // `IModel.strokes`, a never-frozen array — see SymbolStore.ts's the only freeze in `src/`) is
    // never cached, so three separate accessor calls would recompute the whole geometry three
    // times over on every pointermove instead of once.
    const { bounds, vertices, edges } = SymbolGeometry.of(symbol)
    const { x, y, width, height } = OBBOps.toBox(bounds)
    const expanded = {
      x: x - radius,
      y: y - radius,
      width: width + 2 * radius,
      height: height + 2 * radius,
    }
    if (!BoxOps.containsPoint(expanded, point)) {
      return false
    }
    if (edges.length === 0) {
      const squaredRadius = radius * radius
      return vertices.some((v) => computeDistanceSquared(point, v) <= squaredRadius)
    }
    return edges.some((edge) => computeDistanceBetweenPointAndSegment(point, edge) < radius)
  }

  attach(layer: HTMLElement): void {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void {
    this.grabber.detach()
  }

  start(info: TPointerInfo): void {
    this.#logger.info("startErase", { info })
    this.currentEraser = EraserOps.create(this.eraserWidth)
    this.currentEraser.pointers.push(info.pointer)
    this.charsToDelete.clear()
    this.renderer.drawSymbol(this.currentEraser!)
  }

  continue(info: TPointerInfo): void {
    this.#logger.info("continueErase", { info })
    if (!this.currentEraser) {
      throw new Error("Can't update current eraser because currentEraser is undefined")
    }
    this.currentEraser.pointers.push(info.pointer)
    this.renderer.drawSymbol(this.currentEraser)
    const currentPoint = info.pointer
    const radius = (this.currentEraser.style.width as number) / 2
    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort erasing for the whole document — skip it like a non-hit
    // instead of throwing.
    if (this.#isTInteractiveInkCanvas(this.canvas)) {
      this.canvas.model.symbols.forEach((s) => {
        if (isText(s)) {
          let hasHitChar = false
          s.chars.forEach((char) => {
            const { x, y, width, height } = char.bounds
            const expanded = {
              x: x - radius,
              y: y - radius,
              width: width + 2 * radius,
              height: height + 2 * radius,
            }
            if (BoxOps.containsPoint(expanded, currentPoint)) {
              if (!this.charsToDelete.has(s.id)) {
                this.charsToDelete.set(s.id, new Set())
              }
              this.charsToDelete.get(s.id)!.add(char.id)
              hasHitChar = true
            }
          })
          if (hasHitChar) {
            this.deletingIds.add(s.id)
            this.renderer.updateDeletingState(s, true)
          }
        } else if (symbolRegistry.has(s.type) && this.#isHitByPoint(s, currentPoint, radius)) {
          this.deletingIds.add(s.id)
          this.renderer.updateDeletingState(s, true)
        }
      })
    } else {
      this.canvas.model.strokes.forEach((s) => {
        if (this.#isHitByPoint(s, currentPoint, radius)) {
          this.deletingIds.add(s.id)
          this.renderer.updateDeletingState(s, true)
        }
      })
    }
  }

  async end(info: TPointerInfo): Promise<void> {
    this.#logger.info("finishErasing", { info })
    this.continue(info)

    this.renderer.removeSymbol(this.currentEraser!.id)
    if (this.#isTInteractiveInkCanvas(this.canvas)) {
      const canvas = this.canvas as TInteractiveInkCanvas
      const symbolsToRemove: string[] = []

      canvas.model.symbols.forEach((s) => {
        if (isText(s) && this.charsToDelete.has(s.id)) {
          const charIdsToDelete = this.charsToDelete.get(s.id)!
          const remainingChars = s.chars.filter((char) => !charIdsToDelete.has(char.id))

          if (remainingChars.length === 0) {
            // All chars deleted, remove the symbol
            symbolsToRemove.push(s.id)
          } else {
            // Some chars deleted, update the symbol directly. The draft is committed here: the old
            // code mutated the clone `model.symbols` had just handed it, drew the result, and never
            // stored it — so the deleted characters came back on any redraw from the document.
            const draft = canvas.model.draftSymbol(s.id)
            if (draft && isText(draft)) {
              draft.chars = remainingChars
              canvas.typeset.setBounds(draft)
              canvas.model.commitSymbol(draft)
              this.renderer.drawSymbol(draft)
            }
          }
        } else if (this.deletingIds.has(s.id)) {
          symbolsToRemove.push(s.id)
        }
      })

      if (symbolsToRemove.length > 0) {
        await canvas.removeSymbols(symbolsToRemove)
      }

      this.deletingIds.clear()
      this.charsToDelete.clear()
    } else {
      this.canvas.removeStrokes([...this.deletingIds])
      this.deletingIds.clear()
    }
    this.currentEraser = undefined
  }
}
