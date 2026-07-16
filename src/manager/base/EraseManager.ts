import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { InkEditor } from "@/editor/variants/InkEditor"
import type { TPointerInfo } from "@/grabber"
import { PointerEventGrabber } from "@/grabber"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { SVGRenderer } from "@/renderer"
import type { TEraser, TPoint, TSegment } from "@/symbol"
import { isText } from "@/symbol"
import { EraserOps } from "@/symbol/eraser/Eraser"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import { computeDistanceBetweenPointAndSegment, computeDistanceSquared } from "@/utils"

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
  editor: TInteractiveInkEditor | InkEditor

  eraserWidth = 5
  currentEraser?: TEraser
  deletingIds: Set<string>
  charsToDelete: Map<string, Set<string>> = new Map()

  constructor(editor: TInteractiveInkEditor | InkEditor) {
    this.#logger.info("constructor")
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
    this.deletingIds = new Set()
  }

  get renderer(): SVGRenderer {
    return this.editor.renderer
  }

  #isTInteractiveInkEditor(editor: TInteractiveInkEditor | InkEditor): editor is TInteractiveInkEditor {
    return "removeSymbols" in editor && typeof editor.removeSymbols === "function"
  }

  #isHitByPoint(symbol: THittable, point: TPoint, radius: number): boolean {
    const { x, y, width, height } = OBBOps.toBox(symbol.bounds)
    const expanded = {
      x: x - radius,
      y: y - radius,
      width: width + 2 * radius,
      height: height + 2 * radius,
    }
    if (!BoxOps.containsPoint(expanded, point)) {
      return false
    }
    const edges = symbol.edges
    if (edges.length === 0) {
      const squaredRadius = radius * radius
      return symbol.vertices.some((v) => computeDistanceSquared(point, v) <= squaredRadius)
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
    if (this.#isTInteractiveInkEditor(this.editor)) {
      this.editor.model.symbols.forEach((s) => {
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
        } else if (this.#isHitByPoint(s, currentPoint, radius)) {
          this.deletingIds.add(s.id)
          this.renderer.updateDeletingState(s, true)
        }
      })
    } else {
      this.editor.model.strokes.forEach((s) => {
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
    if (this.#isTInteractiveInkEditor(this.editor)) {
      const editor = this.editor as TInteractiveInkEditor
      const symbolsToRemove: string[] = []

      editor.model.symbols.forEach((s) => {
        if (isText(s) && this.charsToDelete.has(s.id)) {
          const charIdsToDelete = this.charsToDelete.get(s.id)!
          const remainingChars = s.chars.filter((char) => !charIdsToDelete.has(char.id))

          if (remainingChars.length === 0) {
            // All chars deleted, remove the symbol
            symbolsToRemove.push(s.id)
          } else {
            // Some chars deleted, update the symbol directly
            s.chars = remainingChars
            editor.typeset.setBounds(s)
            this.renderer.drawSymbol(s)
          }
        } else if (this.deletingIds.has(s.id)) {
          symbolsToRemove.push(s.id)
        }
      })

      if (symbolsToRemove.length > 0) {
        await editor.removeSymbols(symbolsToRemove)
      }

      this.deletingIds.clear()
      this.charsToDelete.clear()
    } else {
      this.editor.removeStrokes(this.deletingIds.values().toArray())
      this.deletingIds.clear()
    }
    this.currentEraser = undefined
  }
}
