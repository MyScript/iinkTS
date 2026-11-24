import type { Geometry2d, TBox, TMatrixTransform, TPartialDeep, TPoint } from "@/core"
import { applyMatrixToPoint, isIdentityMatrix, MatrixTransform } from "@/core"
import type { TBaseSymbol, TResizePoint } from "@/symbol"

import { SymbolGeometry } from "./SymbolGeometry"
import type { TTransformContext } from "./TransformContext"

/**
 * @group SymbolUtils
 * @summary Plugin interface for registering symbol behaviour.
 *
 * Implement this class to add a new symbol type that participates in the
 * standard dispatch for factory, derived-field updates, overlap detection,
 * snap-point extraction, and capability flags.
 *
 * Register with `symbolRegistry.register(new MyUtil())`.
 *
 * @example
 * class StickyNoteUtil extends SymbolUtil<TStickyNote> {
 *   readonly type = "sticky-note"
 *   create(partial) { ... }
 *   getGeometry(s) { ... }
 *   translate(s, { matrix }) { ... }
 *   rotate(s, { matrix }) { ... }
 *   resize(s, { matrix }) { ... }
 *   getSVGElement(s) { ... }
 * }
 * symbolRegistry.register(new StickyNoteUtil())
 */
export abstract class SymbolUtil<T extends TBaseSymbol> {
  abstract readonly type: string

  abstract create(params: TPartialDeep<T>): T

  /**
   * This symbol's geometry: a shape that answers overlap, containment and distance for itself.
   *
   * The one thing a symbol type has to describe. Everything the library used to ask a type for
   * separately — its bounds, its vertices, whether a query touches it — is a question this shape
   * answers, so a new type supplies this and inherits the rest.
   */
  abstract getGeometry(symbol: T): Geometry2d

  /**
   * Whether a query box touches this symbol — the question selection and erasing both ask.
   *
   * Answered by the shape {@link getGeometry} returns, so a type describes what it is once and
   * inherits this. Every built-in used to write the same one line here. Override it only for a type
   * whose hit test is not a question about its outline.
   */
  overlaps(symbol: T, box: TBox): boolean {
    return SymbolGeometry.of(symbol).overlapsBox(box)
  }

  /**
   * `points`, carried through `symbol.transform` the same way a transform manager moves the symbol
   * itself — used by `getSnapPoints`/`getResizePoints` overrides, which compute in the symbol's raw
   * frame and hand the result through this once, forward, rather than every symbol type mapping its
   * own points individually.
   *
   * Forward, and exact: a point maps to a point however the matrix turns or scales, so `points` are
   * already the symbol's own geometry, and mapping a point through a matrix is always exact, however
   * that matrix turns or scales.
   */
  protected mapPointsForward(symbol: T, points: TPoint[]): TPoint[] {
    const transform = symbol.transform ?? MatrixTransform.identity()
    return isIdentityMatrix(transform) ? points : points.map((point) => applyMatrixToPoint(point, transform))
  }

  /**
   * Moves, turns or scales this symbol by composing the matrix onto the one it already carries.
   *
   * One implementation for every type, where there used to be one per type per operation. A
   * symbol's coordinates are not touched: the matrix is the whole of what a transform changes, so
   * there is no per-type geometry to update and nothing derived left to refresh.
   *
   * Override only for a type whose transform is not affine — `DecoratorUtil` overrides it to a
   * no-op because a decorator follows its targets rather than moving on its own.
   */
  applyTransform(symbol: T, matrix: TMatrixTransform): void {
    symbol.transform = new MatrixTransform(matrix.xx, matrix.yx, matrix.xy, matrix.yy, matrix.tx, matrix.ty).multiply(
      symbol.transform
    )
  }

  /**
   * Moves this symbol by a matrix.
   *
   * Concrete rather than abstract: every built-in type composes the matrix the same way, through
   * {@link applyTransform}, and none of the six overrides this. A custom util only needs its own
   * body if it stores something a matrix cannot express.
   */
  translate(symbol: T, { matrix }: TTransformContext): void {
    this.applyTransform(symbol, matrix)
  }

  /**
   * Turns this symbol. Composes through {@link applyTransform}, for the same reason
   * {@link translate} does.
   */
  rotate(symbol: T, { matrix }: TTransformContext): void {
    this.applyTransform(symbol, matrix)
  }

  /**
   * Scales this symbol. Composes through {@link applyTransform}, for the same reason
   * {@link translate} does.
   */
  resize(symbol: T, { matrix }: TTransformContext): void {
    this.applyTransform(symbol, matrix)
  }

  getSnapPoints(_symbol: T): TPoint[] {
    return []
  }

  /**
   * Handles for dragging one vertex of this symbol. Empty by default: most symbols resize by their
   * bounding box alone, and only the edge kinds offer per-vertex handles today.
   */
  getResizePoints(_symbol: T): TResizePoint[] {
    return []
  }

  canSelect(_symbol: T): boolean {
    return true
  }

  canTransform(_symbol: T): boolean {
    return true
  }

  canResize(_symbol: T): boolean {
    return true
  }

  canRotate(_symbol: T): boolean {
    return true
  }

  /**
   * Whether a resize of this symbol must preserve its aspect ratio.
   *
   * False by default. `IIResizeManager` decided this with
   * `isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))`, which is a question about a
   * symbol asked from outside it — so a custom symbol could never require a locked ratio, however
   * badly a free scale would distort it.
   */
  keepsAspectRatio(_symbol: T): boolean {
    return false
  }

  /**
   * The element that draws this symbol.
   *
   * Required rather than optional: a symbol nothing can draw is a symbol the canvas cannot show,
   * and when this was optional a custom util that omitted it registered successfully and then
   * silently rendered nothing. Return `undefined` only for a state deliberately left undrawn — the
   * decorator does that for a kind it does not own.
   *
   * Honoured by the SVG renderer, which `InteractiveInkCanvas`, `InkCanvas` and
   * `InteractiveInkSSRCanvas` all use. **`InkCanvasDeprecated` (INK_V1) ignores it**: it draws
   * through `CanvasRenderer`, which dispatches on `isStroke` and two fixed renderer tables instead
   * of asking the registry, so a registered custom symbol is invisible there and logs
   * "symbol type unknown". That variant is deprecated and not worth wiring up.
   */
  abstract getSVGElement(symbol: T): SVGGraphicsElement | undefined

  /**
   * The attributes on the group every symbol is drawn inside.
   *
   * The same five for every type, plus the matrix when there is one — written once here rather than
   * copied into each `getSVGElement`, where six copies had already started to drift apart in what
   * they called the `type` attribute.
   *
   * A type that needs more overrides this and spreads the result: the shape and edge families add
   * their `kind`, and the typeset one adds what a rendered word needs that a path does not.
   */
  protected getGroupAttributes(symbol: T): Record<string, string> {
    const attributes: Record<string, string> = {
      id: symbol.id,
      type: symbol.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    // Guarded rather than read straight: a symbol of a kind no table owns is tolerated all the way
    // to here, and such an object can arrive without the matrix `mergeSymbolTransform` normally
    // backfills. Reading `undefined` would throw a meaningless error over the meaningful one the
    // caller is about to raise about the kind itself.
    const transform = symbol.transform
    if (transform && !isIdentityMatrix(transform)) {
      attributes.transform = MatrixTransform.toCssString(transform)
    }
    return attributes
  }
}
