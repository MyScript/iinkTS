import { OBBOps, Polygon2d, type TPoint } from "@/core"
import type { TMath, TText } from "@/symbol"
import { computeTypesetSnapPoints, computeTypesetVertices, DecoratorKind } from "@/symbol"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import { SymbolUtil } from "../SymbolUtil"

/**
 * @group SymbolUtils
 * @summary What text and math share, which is nearly everything.
 *
 * `TText` and `TMath` are the same shape but for the list they hold — `chars` against `elements` —
 * so the two utils were the same code twice over. Worse, the resize path was literally one method
 * on `IIResizeManager` that branched on `isText(symbol)` twice, once to reach the right list and
 * once to reach the right derive.
 *
 * A typeset symbol used to differ from a geometric one in how it turns and resizes: it recorded an
 * angle instead of moving a coordinate, and rebuilt its bounds from scale factors instead of
 * rescaling anything by hand. Both of those were per-type code, and both are gone — `translate`,
 * `rotate` and `resize` are `SymbolUtil`'s now, composing the matrix like every other type. What is
 * left here is the one thing that is still genuinely different: a typeset symbol is **measured, not
 * computed** — its bounds come from drawing it into the DOM hidden and reading `getBBox()`, always
 * unrotated and unscaled, because turning and scaling are the matrix's job from here on.
 */
/**
 * Stops a drag over rendered glyphs from selecting them as text: the gesture belongs to the symbol,
 * not to the letters. Both typeset utils carried this same string.
 */
const noSelection =
  "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;"

export abstract class TypesetUtil<T extends TText | TMath> extends SymbolUtil<T> {
  // The parameter is deliberately not widened to a structural "has a point and bounds" shape. It
  // could be, but the port that measures these symbols cannot: `IITypesetManager.updateBounds`
  // handles text and math and nothing else, so a third subclass would compile and then fail at the
  // one call it cannot avoid.

  /**
   * Shared whole: `TText` and `TMath` derive identically, down to the formula. `symbol.bounds` is
   * always the raw, unrotated box a typeset symbol was measured at — the matrix, not a stored angle,
   * is what turns it, and `SymbolGeometry` applies that matrix on top of this raw geometry.
   */
  /**
   * The box the symbol was measured at, as a shape.
   *
   * An outline rather than a filled one, and that is the behaviour it had: `typesetOverlapsBox` asked
   * "a corner inside the query, or a side crossing one of its sides", both about the boundary. A
   * query landing wholly inside a word therefore did not select it, and still does not.
   *
   * `symbol.bounds` is the raw box, always measured unrotated and unscaled — turning and scaling are
   * the matrix's job — so its corners are the shape, and a frame angle would have nothing to carry.
   */
  getGeometry(symbol: T): Polygon2d {
    return new Polygon2d(computeTypesetVertices(OBBOps.toUnrotatedBox(symbol.bounds)))
  }

  /**
   * Where a typeset symbol offers to snap, before its matrix: the corners of its box lifted onto the
   * baseline, and its centre. Not the box's own corners — a word is read from its baseline, and
   * lining two words up by their descenders would look wrong.
   */
  protected rawSnapPoints(symbol: T): TPoint[] {
    return computeTypesetSnapPoints(OBBOps.toUnrotatedBox(symbol.bounds), symbol.point)
  }

  /**
   * A rendered word carries what a path does not: `style: noSelection`, so a drag over it moves the
   * symbol instead of selecting its letters as text, and its opacity — which for a path symbol goes
   * on the path, and here has no path to go on.
   */
  protected override getGroupAttributes(symbol: T): Record<string, string> {
    const attributes: Record<string, string> = { ...super.getGroupAttributes(symbol), style: noSelection }
    if (symbol.style.opacity) {
      attributes.opacity = symbol.style.opacity.toString()
    }
    return attributes
  }

  /**
   * The glyphs this symbol draws, in the order they go into the group.
   *
   * The only thing text and math do differently: text lays its characters out as tspans on one
   * baseline, math positions super- and subscripts itself. Everything around it — the group, its
   * attributes, the decorators and the order they are layered in — is shared below.
   */
  protected abstract buildContent(symbol: T): SVGElement[]

  /**
   * The group, the glyphs, then the decorators — highlights underneath, everything else on top.
   *
   * That layering is why decorators are appended here rather than by each subclass: a highlight
   * drawn after the text would paint over it, and the two utils had the same ten lines to avoid it.
   */
  getSVGElement(symbol: T): SVGGraphicsElement {
    const group = SVGBuilder.createGroup(this.getGroupAttributes(symbol))
    this.buildContent(symbol).forEach((element) => group.append(element))
    symbol.decorators.forEach((decorator) => {
      const rendered = DecoratorUtil.renderForSymbol(decorator, symbol)
      if (!rendered) {
        return
      }
      if (decorator.kind === DecoratorKind.Highlight) {
        group.prepend(rendered)
      } else {
        group.append(rendered)
      }
    })
    return group
  }

  /** Shared by text and math, which had the same one line each. */
  /** Shared by text and math, which had the same one line each. */
  getSnapPoints(symbol: T): TPoint[] {
    return this.mapPointsForward(symbol, this.rawSnapPoints(symbol))
  }

  /**
   * Always. A typeset symbol is drawn from glyphs at a font size, and a font size is one number —
   * scaling the axes unequally would ask for glyphs that do not exist.
   */
  keepsAspectRatio(_symbol: T): boolean {
    return true
  }
}
