import type { TBaseSymbol } from "@/symbol"

import { SVGBuilder } from "./SVGBuilder"
import { SymbolUtil } from "./SymbolUtil"

/**
 * @group SymbolUtils
 * @summary A symbol drawn as a single `<path>`.
 *
 * The shape of most of what the library renders — a stroke, a geometric shape, an edge. Each one
 * used to build a `<g>`, append one `<path>` to it and return the group, which is three copies of an
 * assembly that differs only in what goes on the path.
 *
 * **There is no group any more.** A group holding exactly one child adds a node per symbol and
 * carries nothing the child could not carry itself: `id`, `type` and `kind` are found by attribute
 * either way, `transform` on a single child is the same transform, and `stroke-linecap` and
 * `stroke-linejoin` inherit. On a 4419-symbol document that is 4419 nodes the browser no longer
 * lays out.
 *
 * **One attribute did not merely move: `vector-effect`.** It is not an inherited property, so on the
 * group it applied to the group — which draws nothing — and never reached the path. It was inert.
 * On the path it takes effect, and `non-scaling-stroke` means what it says: stroke width stops
 * growing with the zoom, since the renderer zooms by `viewBox`. That is a deliberate change of
 * appearance, not a side effect — the attribute had been asking for this since it was written.
 *
 * A type in this family says what its path is worth drawing — its `d`, and the fill, stroke and
 * width around it — and inherits the rest.
 */
export abstract class PathSymbolUtil<T extends TBaseSymbol> extends SymbolUtil<T> {
  /**
   * The `d` of the path this symbol draws.
   *
   * Separate from {@link PathSymbolUtil.getPathAttributes} because it is the one part no default can
   * supply and the one part a new type always has to write: `d` *is* the shape as drawn.
   */
  protected abstract getPathData(symbol: T): string

  /**
   * Everything on that path except `d` — fill, stroke, width, and whatever else the type paints
   * with.
   *
   * No default: the three built-in families disagree on all three of those, and they are right to.
   * A stroke is a filled outline with no stroke colour at all; an edge is a stroked line on no fill;
   * a shape is both, and its fill comes from the style. A default here would be one of the three
   * quietly imposed on the others.
   */
  protected abstract getPathAttributes(symbol: T): Record<string, string>

  getSVGElement(symbol: T): SVGGraphicsElement {
    const outer = this.getGroupAttributes(symbol)
    const inner = this.getPathAttributes(symbol)
    return SVGBuilder.createPath({
      ...outer,
      ...inner,
      ...PathSymbolUtil.#composeTransforms(outer.transform, inner.transform),
      d: this.getPathData(symbol),
    })
  }

  /**
   * The symbol's matrix and whatever the kind turns its path by, on one element.
   *
   * Both used to have an element of their own — the matrix on the group, the kind's own rotation on
   * the path — so nesting composed them and neither had to know about the other. On a single element
   * a plain merge would let the second silently replace the first, which for a turned ellipse that
   * has also been moved means losing the move entirely.
   *
   * Order is the nesting order: SVG applies a transform list right to left, so the kind's rotation
   * runs first — as the inner element's did — and the symbol's matrix after it.
   */
  static #composeTransforms(outer?: string, inner?: string): { transform?: string } {
    if (!outer || !inner) {
      return outer || inner ? { transform: outer ?? inner } : {}
    }
    return { transform: `${outer} ${inner}` }
  }
}
