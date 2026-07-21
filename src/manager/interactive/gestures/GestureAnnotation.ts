import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TIIHistoryChanges } from "@/history"
import type { DecoratorKind, TBox, TDecorator, TStroke, TText } from "@/symbol"
import { isDecorator, isRecognizedText, isStroke, isText, SymbolType, type TSymbol } from "@/symbol"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"

/**
 * Unified representation of a gesture's intent on a set of target strokes.
 * Handlers write annotations; IIGestureAnnotationProcessor executes them.
 * @group Manager
 */
export type TGestureAnnotation =
  | {
      kind: "decorator"
      decoratorKind: DecoratorKind
    }
  | { kind: "erase" }
  | { kind: "thicken"; factor: number }
  | { kind: "select" }

/**
 * Centralized executor for gesture annotations.
 * Standalone TDecorator symbols live in model.symbols with targetIds referencing strokes.
 * @group Manager
 */
export class IIGestureAnnotationProcessor {
  constructor(private canvas: TInteractiveInkCanvas) {}

  async apply(ids: string[], annotation: TGestureAnnotation): Promise<TIIHistoryChanges | undefined> {
    switch (annotation.kind) {
      case "decorator":
        return this.#applyDecorator(ids, annotation.decoratorKind)
      case "erase":
        await this.canvas.removeSymbols(ids)
        return undefined
      case "thicken": {
        const changed = this.#applyThicken(ids, annotation.factor)
        return changed.length ? { style: { symbols: changed } } : undefined
      }
      case "select":
        this.#applySelect(ids)
        return undefined
    }
  }

  async #applyDecorator(ids: string[], kind: DecoratorKind): Promise<TIIHistoryChanges | undefined> {
    await this.#waitForPendingClassification(ids)

    const seenWordKeys = new Set<string>()
    const added: TDecorator[] = []
    const erased: TDecorator[] = []

    for (const id of ids) {
      const sym = this.canvas.model.getRootSymbol(id)
      if (!sym) {
        continue
      }

      if (isText(sym)) {
        this.#toggleTextDecorator(sym, kind, added, erased)
        continue
      }

      if (!isRecognizedText(sym as TStroke)) {
        continue
      }

      const wordGroup = this.canvas.jiix.getWordGroupForStroke(sym.id)
      if (wordGroup) {
        if (seenWordKeys.has(wordGroup.wordKey)) {
          continue
        }
        seenWordKeys.add(wordGroup.wordKey)
        this.#toggleWordDecorator(
          wordGroup.allStrokeIds,
          wordGroup.wordBounds,
          wordGroup.baseline,
          wordGroup.xHeight,
          kind,
          added,
          erased
        )
      } else {
        // JIIX not yet available — treat stroke as its own group
        if (seenWordKeys.has(sym.id)) {
          continue
        }
        seenWordKeys.add(sym.id)
        this.#toggleWordDecorator([sym.id], null, null, null, kind, added, erased)
      }
    }

    if (!added.length && !erased.length) {
      return undefined
    }
    const changes: TIIHistoryChanges = {}
    if (added.length) {
      changes.added = added
    }
    if (erased.length) {
      changes.erased = erased
    }
    return changes
  }

  /**
   * A stroke's `jiixBlockType` (its recognition classification, e.g. "Text") is assigned
   * asynchronously once its own recognition round-trip completes — a separate round-trip
   * from (and not necessarily faster than) the one classifying a gesture drawn around/through
   * it. Without this wait, a decorator gesture applied right after writing its target can
   * find the target stroke present but still unclassified, silently skip it (`isRecognizedText`
   * below is false), and produce no decorator at all — measured up to ~800ms of real
   * classification latency in a slower environment (WebKit/Safari). Give it a couple of
   * seconds to land before giving up on a still-pending candidate.
   */
  async #waitForPendingClassification(ids: string[]): Promise<void> {
    const isPending = () =>
      ids.some((id) => {
        const sym = this.canvas.model.getRootSymbol(id)
        return sym && isStroke(sym) && !sym.jiixBlockType
      })
    for (const delay of [100, 200, 300, 400, 500, 500]) {
      if (!isPending()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  #toggleWordDecorator(
    targetIds: string[],
    wordBounds: TBox | null,
    baseline: number | null,
    xHeight: number | null,
    kind: DecoratorKind,
    added: TDecorator[],
    erased: TDecorator[]
  ): void {
    const existing = this.canvas.model.symbols
      .filter(isDecorator)
      .find((d) => d.kind === kind && this.#sameTargets(d.targetIds, targetIds))

    if (existing) {
      this.canvas.model.removeSymbol(existing.id)
      this.canvas.renderer.removeElement(existing.id)
      erased.push(existing)
    } else {
      const decorator = DecoratorOps.create(kind, this.canvas.penStyle, targetIds)
      if (wordBounds) {
        DecoratorOps.setBounds(decorator, OBBOps.fromBox(wordBounds))
      } else {
        const bounds = this.#computeBoundsFromTargets(targetIds)
        if (bounds) {
          DecoratorOps.setBounds(decorator, bounds)
        }
      }
      if (baseline !== null) {
        decorator.baseline = baseline
      }
      if (xHeight !== null) {
        decorator.xHeight = xHeight
      }
      this.canvas.model.addSymbol(decorator)
      this.canvas.renderer.drawSymbol(decorator)
      added.push(decorator)
    }
  }

  #toggleTextDecorator(sym: TText, kind: DecoratorKind, added: TDecorator[], erased: TDecorator[]): void {
    const index = sym.decorators.findIndex((d) => d.kind === kind)
    if (index !== -1) {
      const removed = sym.decorators.splice(index, 1)[0]
      this.canvas.model.updateSymbol(sym)
      this.canvas.renderer.drawSymbol(sym)
      erased.push(removed)
    } else {
      const decorator = DecoratorOps.create(kind, this.canvas.penStyle)
      sym.decorators.push(decorator)
      this.canvas.model.updateSymbol(sym)
      this.canvas.renderer.drawSymbol(sym)
      added.push(decorator)
    }
  }

  #sameTargets(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false
    }
    const setA = new Set(a)
    return b.every((id) => setA.has(id))
  }

  #computeBoundsFromTargets(targetIds: string[]): TOBB | null {
    const syms = targetIds.map((id) => this.canvas.model.getRootSymbol(id)).filter((s): s is TSymbol => !!s)
    if (!syms.length) {
      return null
    }
    return OBBOps.createFromOBBs(syms.map((s) => s.bounds))
  }

  #applyThicken(ids: string[], factor: number): TStroke[] {
    const changed: TStroke[] = []
    const seen = new Set<string>()
    for (const id of ids) {
      const sym = this.canvas.model.getRootSymbol(id)
      if (!sym || sym.type !== SymbolType.Stroke || seen.has(sym.id)) {
        continue
      }
      seen.add(sym.id)
      const stroke = sym as TStroke
      const newWidth = (stroke.style.width || 1) * factor
      this.canvas.updateSymbolsStyle([stroke.id], { width: newWidth }, false)
      changed.push(stroke)
    }
    return changed
  }

  #applySelect(ids: string[]): void {
    if (ids.length) {
      this.canvas.select(ids)
    }
  }
}
