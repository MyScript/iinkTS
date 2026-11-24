import type { TInteractiveInkCanvas } from "@/canvas"
import { applyMatrixToPoint, MatrixTransform } from "@/core"
import type { TIIHistoryChanges } from "@/history"
import { appendUpdated } from "@/history"
import { LoggerCategory } from "@/logger"
import { SvgElementRole } from "@/renderer"
import type { TDecorator, TStroke, TSymbol } from "@/symbol"
import { isDecorator, isStroke } from "@/symbol"
import { DecoratorUtil, SymbolGeometry } from "@/symbol-utils"

import { IIAbstractManager } from "../IIAbstractManager"

/**
 * Abstract base class for transform managers (translate, rotate, resize)
 * @group Manager
 */
export abstract class IIAbstractTransformManager extends IIAbstractManager {
  interactElementsGroup?: SVGElement

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.TRANSFORMER)
  }

  /**
   * The gesture's matrix, previewed on top of the one the symbol already carries.
   *
   * The live part multiplies onto the stored one rather than replacing it, so the SVG transform list
   * reads outside-in: the symbol sits where its own matrix puts it, and the gesture moves it from
   * there — the same order the commit will apply. Writing the live transform alone is what made an
   * already-moved symbol snap back to its raw coordinates for the length of a drag and jump into
   * place on release (IIC-1999). Before this epic only a rotated typeset carried a baked transform;
   * now every moved symbol does, so the same overwrite would affect all of them.
   *
   * The stored matrix is untouched here. This is a preview: `applyAndDraw` is what settles it.
   */
  protected previewTransform(symbol: TSymbol, live: MatrixTransform): void {
    this.canvas.renderer.setAttribute(symbol.id, "transform", live.clone().multiply(symbol.transform).toCssString())
  }

  /**
   * The same, for an element with no symbol behind it — the interact-elements group, or a math
   * ghost stroke. Nothing is composed because nothing is stored: these are drawn in document
   * coordinates already.
   *
   * Note both preview methods write a full `matrix(...)`, carrying their own centre. The
   * `transform-origin` attribute this class used to set cannot serve here: it applies to the whole
   * transform list, so it would displace the stored matrix, which brings its own centre.
   */
  protected previewElementTransform(id: string, live: MatrixTransform): void {
    this.canvas.renderer.setAttribute(id, "transform", live.toCssString())
  }

  protected resolveInteractGroup(target: Element): SVGGElement {
    return target.closest(`[role=${SvgElementRole.InteractElementsGroup}]`) as unknown as SVGGElement
  }

  /**
   * Applies a matrix transform locally (model + redraw) without touching the backend or
   * history. Used by InteractiveInkCanvas's undo/redo replay dispatcher, which sends its own
   * consolidated backend message separately.
   */
  applyMatrix(symbols: TSymbol[], matrix: MatrixTransform): void {
    this.applyAndDraw(symbols, matrix)
  }

  /**
   * Records a transform as the before/after pair `updated` wants, resolving "after" from the
   * document by id rather than from the caller.
   *
   * By id, because a transform commits a draft: the object the caller holds is the pre-transform
   * snapshot, and reading the moved value off it would record no change at all. Resolving both
   * sides here also keeps the two lists the same length — a symbol the document no longer holds is
   * dropped from both rather than shifting every pair after it.
   *
   * Call after `applyAndDraw`, with the snapshots taken before it.
   */
  protected recordTransformed(changes: TIIHistoryChanges, snapshots: TSymbol[]): void {
    appendUpdated(
      changes,
      snapshots.flatMap((before) => {
        // The committed record is frozen, so it is a value the history can hold as-is — no clone.
        const after = this.model.getSymbol(before.id)
        return after ? [{ before, after }] : []
      })
    )
  }

  /**
   * Returns the pre-transform records of the standalone decorators that followed `symbols`, for
   * the caller to hand to {@link recordTransformed}: they are moved here, outside the selection, so
   * no caller snapshot holds them and undo would otherwise leave them where the gesture put them.
   */
  protected applyAndDraw(symbols: TSymbol[], matrix: MatrixTransform): TDecorator[] {
    symbols.forEach((s) => {
      // No fallback on the passed symbol: since IIC-1972 the history stack holds values rather than
      // references into the document, so a symbol the document no longer holds is one there is
      // nothing to transform. The old path mutated the detached object and drew it anyway, painting
      // something the model had already forgotten.
      const target = this.model.draftSymbol(s.id)
      if (!target) {
        return
      }
      this.applyToSymbol(target, matrix)
      this.model.commitSymbol(target)
      // Committing rewrites only the `transform` attribute instead of rebuilding the element: the
      // element's geometry is the symbol's raw coordinates, which a transform never changes. The
      // renderer must see the frozen, committed record here (not `target`, the now-stale draft) so
      // that `SymbolGeometry`'s frozen-only cache actually holds for it.
      this.canvas.renderer.setSymbolTransform(this.model.getSymbol(target.id) ?? target)
    })
    return this.updateDecoratorsForTargets(symbols, matrix)
  }

  /**
   * The live gesture, previewed on the standalone decorators carried by `symbols`.
   *
   * Only those whose every target is in `symbols`: they are the ones the commit moves by the same
   * matrix (see `updateDecoratorsForTargets`), so previewing them any other way would show a
   * decoration that jumps on release. A decorator only partly moved has its box refitted at commit
   * instead, which a matrix cannot preview.
   */
  protected previewDecorators(symbols: TSymbol[], live: MatrixTransform): void {
    this.decoratorsCarriedBy(symbols).forEach(({ decorator, whole }) => {
      if (whole) {
        this.previewTransform(decorator, live)
      }
    })
  }

  /**
   * The standalone decorators targeting any of `symbols`, each flagged `whole` when all of its
   * targets are among them. Decorators are never part of `symbolsSelected` (selection redirects to
   * their targetIds), so a transform reaches them only through here.
   */
  private decoratorsCarriedBy(symbols: TSymbol[]): { decorator: TDecorator; whole: boolean }[] {
    const movedIds = new Set(symbols.map((s) => s.id))
    const byTargetId = this.model.decoratorsByTargetId
    const affected = new Map<string, TDecorator>()
    symbols.forEach((s) => byTargetId.get(s.id)?.forEach((deco) => isDecorator(deco) && affected.set(deco.id, deco)))
    return [...affected.values()].map((decorator) => ({
      decorator,
      whole: decorator.targetIds.every((id) => movedIds.has(id)),
    }))
  }

  /**
   * Keeps standalone decorators on the symbols they decorate after those were transformed.
   *
   * A decorator whose targets all moved takes the very matrix they took, composed onto its own:
   * its `targetBounds` and `baseline` stay in its local frame, so a rotation turns the decoration
   * with the ink instead of re-deriving an axis-aligned box around it. A decorator only partly
   * moved cannot follow one matrix, so its box is refitted around its targets, in its local frame.
   */
  private updateDecoratorsForTargets(symbols: TSymbol[], matrix: MatrixTransform): TDecorator[] {
    return this.decoratorsCarriedBy(symbols).flatMap(({ decorator, whole }) => {
      const draft = this.model.draftSymbol(decorator.id)
      if (!draft || !isDecorator(draft)) {
        return []
      }
      if (whole) {
        // Composed here rather than through `applyToSymbol`: `DecoratorUtil.applyTransform` stays a
        // no-op so that nothing else (duplicate, paste) moves a decorator independently of its targets.
        draft.transform = matrix.clone().multiply(draft.transform)
      } else {
        this.refitDecorator(draft, matrix)
      }
      this.model.commitSymbol(draft)
      this.canvas.renderer.drawSymbol(draft)
      // The committed record read before the draft was taken is frozen, so it is the "before" as-is.
      return [decorator]
    })
  }

  /**
   * Refits a partly-moved decorator's box around its targets, expressed in the decorator's own frame
   * so that its stored matrix still places it. `baseline` is an absolute y in that frame, so it takes
   * the gesture's matrix as seen from that frame.
   */
  private refitDecorator(draft: TDecorator, matrix: MatrixTransform): void {
    const targets = draft.targetIds.map((id) => this.model.getSymbol(id)).filter((s): s is TSymbol => !!s)
    if (!targets.length) {
      return
    }
    const anchorX = draft.targetBounds?.center.x ?? 0
    DecoratorUtil.refitTargetBounds(
      draft,
      targets.map((s) => SymbolGeometry.boundsOf(s))
    )
    if (draft.baseline !== undefined) {
      const local = MatrixTransform.identity()
        .multiply(draft.transform)
        .invert()
        .multiply(matrix)
        .multiply(draft.transform)
      draft.baseline = applyMatrixToPoint({ x: anchorX, y: draft.baseline }, local).y
    }
  }

  /**
   * Live model symbols for the pre-convert edge strokes that rigidly follow a transform
   * (see IIConnectorManager), minus any already present in `alreadyIncluded`.
   * They are transformed outside `applyAndDraw`, so history entries and backend transform
   * messages must list them explicitly or undo and the server's ink both drift out of sync.
   */
  protected resolveFollowedSymbols(followedIds: string[], alreadyIncluded: TSymbol[]): TSymbol[] {
    if (followedIds.length === 0) {
      return []
    }
    const knownIds = new Set(alreadyIncluded.map((s) => s.id))
    return followedIds
      .filter((id) => !knownIds.has(id))
      .map((id) => this.model.getSymbol(id))
      .filter((s): s is TSymbol => !!s)
  }

  protected finalizeTransform(): void {
    this.interactElementsGroup = undefined
    this.canvas.overlays.apply()
    this.canvas.selector.drawSelectedGroup(this.canvas.model.symbolsSelected)
  }

  private getSelectedMathBlockIds(symbols: TSymbol[]): Set<string> {
    const ids = new Set<string>()
    symbols.forEach((s) => {
      if (isStroke(s) && s.jiixBlockType === "Math" && s.jiixBlockId) {
        ids.add(s.jiixBlockId)
      }
    })
    return ids
  }

  /**
   * Element ids of the ghost previews attached to the given selection's math blocks —
   * for live CSS-transform following while a translate/resize/rotate drag is in progress.
   */
  protected getGhostStrokeIdsForSelectedMath(symbols: TSymbol[]): string[] {
    const ids: string[] = []
    this.getSelectedMathBlockIds(symbols).forEach((id) => {
      ids.push(...(this.canvas.math.getGhostStrokeIds(id) ?? []))
    })
    return ids
  }

  /**
   * Permanently applies the given transform matrix to the ghost previews attached to the
   * selection's math blocks, so they stay visually attached once the drag settles.
   */
  protected applyTransformToGhostStrokesForSelectedMath(symbols: TSymbol[], matrix: MatrixTransform): void {
    this.getSelectedMathBlockIds(symbols).forEach((id) => {
      this.canvas.math.applyTransformToGhostStrokes(id, matrix)
    })
  }

  /**
   * Gradient-followed strokes were reshaped non-uniformly by the connector — their points did not
   * all move by the same delta — so the backend cannot be asked to apply this transform to them.
   * Their full new content has to be sent instead. Returns one `replaceStrokes` call per such
   * stroke, to be spread into the transform's own `Promise.all`.
   */
  protected replaceGradientFollowedStrokes(
    anchoredOldSymbols: TSymbol[],
    anchoredNewSymbols: TSymbol[]
  ): Promise<void>[] {
    return anchoredNewSymbols
      .map((newSymbol, i) => ({ oldSymbol: anchoredOldSymbols[i], newSymbol }))
      .filter((pair): pair is { oldSymbol: TStroke; newSymbol: TStroke } => isStroke(pair.newSymbol))
      .map(({ oldSymbol, newSymbol }) => this.canvas.client.replaceStrokes([oldSymbol.id], [newSymbol]))
  }

  /**
   * Applies this manager's own operation to a symbol, through the symbol's util.
   *
   * One member instead of the five per-type ones this class used to declare. Those existed to be
   * reached by a `switch (symbol.type)` here, which is what made a symbol type the library did not
   * know untransformable: it fell to a throwing `default` however well its util was registered.
   */
  protected abstract applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void

  applyToSymbol(symbol: TSymbol, matrix: MatrixTransform): TSymbol {
    this.logger.info("applyToSymbol", { symbol })
    // No branch on type, and no early return for decorators — `DecoratorUtil` implements all three
    // operations as deliberate no-ops, which is where that exception now reads. An unregistered
    // type still fails, from `getUtilFor`, with a message that also lists what *is* registered.
    this.applyThroughUtil(symbol, matrix)
    return symbol
  }
}
