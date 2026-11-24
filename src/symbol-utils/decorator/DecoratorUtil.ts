import type { TBox, TPartialDeep, TPoint } from "@/core"
import {
  applyInverseMatrixToPoint,
  createUUID,
  type Geometry2d,
  isIdentityMatrix,
  MatrixTransform,
  mergeSymbolTransform,
  OBBOps,
  Polygon2d,
  type TOBB,
} from "@/core"
import { DefaultStyle, mergeSymbolStyle, type TStyle } from "@/style"
import type { TBaseSymbol } from "@/symbol"
import { DecoratorKind, SymbolType, type TDecorator } from "@/symbol"

import { SVGBuilder } from "../SVGBuilder"
import { SymbolGeometry } from "../SymbolGeometry"
import { SymbolUtil } from "../SymbolUtil"

/**
 * How one kind of decorator is drawn.
 *
 * Not the shared `TKindDefinition` used by the shape and edge tables: a decorator does not produce
 * a path string but a whole element, and it needs the decorated symbol's stroke width and the text
 * metrics to place itself. Same idea, different contract.
 */
type TDecoratorKindDefinition = {
  /** Attributes this kind layers over the shared ones. */
  attributes(decorator: TDecorator): Record<string, string>
  /** The element this kind draws. */
  render(context: TDecoratorRenderContext, attrs: { [key: string]: string }): SVGGeometryElement
}

/** What every kind needs to place itself, resolved once before the table is consulted. */
type TDecoratorRenderContext = {
  box: TBox
  /** From the decorated symbol, not the decorator: it is what the decoration has to clear. */
  strokeWidth: number
  baseline?: number
  xHeight?: number
}

/** The attributes shared by every decoration drawn as an outline — all of them but the highlight. */
function outlineAttributes(decorator: TDecorator): Record<string, string> {
  return {
    fill: "transparent",
    stroke: decorator.style.color || DefaultStyle.color!,
    "stroke-width": (decorator.style.width || DefaultStyle.width).toString(),
  }
}

/** The decorated bounds grown by one symbol stroke width on every side. */
function inflatedBox({ box, strokeWidth }: TDecoratorRenderContext): TBox {
  return {
    x: box.x - +strokeWidth,
    y: box.y - +strokeWidth,
    width: box.width + +strokeWidth * 2,
    height: box.height + +strokeWidth * 2,
  }
}

/**
 * A line spanning the decorated bounds.
 *
 * `fallbackY` places it from the bounding box; when the text metrics are there the line follows the
 * baseline instead, which is what keeps an underline under the glyphs rather than under the box
 * their ascenders inflate. Both metrics are required — one alone says nothing.
 */
function horizontalLine(
  context: TDecoratorRenderContext,
  fallbackY: number,
  fromBaseline: (baseline: number, xHeight: number) => number,
  attrs: { [key: string]: string }
): SVGGeometryElement {
  const { box, baseline, xHeight } = context
  const y = baseline !== undefined && xHeight !== undefined ? fromBaseline(baseline, xHeight) : fallbackY
  return SVGBuilder.createLine({ x: box.x, y }, { x: box.x + box.width, y }, attrs)
}

/**
 * The decorator kinds this util can draw, and how. Adding a kind is adding an entry.
 *
 * The `switch` this replaced repeated the outline attributes in three of its four branches and
 * built the same inflated rect in two of them.
 */
const DECORATOR_KINDS: Partial<Record<DecoratorKind, TDecoratorKindDefinition>> = {
  [DecoratorKind.Highlight]: {
    // The one kind that fills rather than outlines, and the one that overrides the decorator's own
    // opacity: a highlight is a wash, and 0.5 is what keeps the decorated symbol readable through
    // it.
    attributes: (decorator) => ({
      opacity: "0.5",
      stroke: "transparent",
      fill: decorator.style.color || DefaultStyle.color!,
    }),
    render: (context, attrs) => SVGBuilder.createRect(inflatedBox(context), attrs),
  },
  [DecoratorKind.Surround]: {
    attributes: outlineAttributes,
    render: (context, attrs) => SVGBuilder.createRect(inflatedBox(context), attrs),
  },
  [DecoratorKind.Strikethrough]: {
    attributes: outlineAttributes,
    render: (context, attrs) =>
      horizontalLine(context, context.box.y + context.box.height / 2, (baseline, xHeight) => baseline - xHeight, attrs),
  },
  [DecoratorKind.Underline]: {
    attributes: outlineAttributes,
    render: (context, attrs) =>
      horizontalLine(
        context,
        context.box.y + context.box.height + +context.strokeWidth,
        (baseline, xHeight) => baseline + xHeight,
        attrs
      ),
  },
}

/**
 * @group SymbolUtils
 */
export class DecoratorUtil extends SymbolUtil<TDecorator> {
  readonly type = SymbolType.Decorator

  create(partial: TPartialDeep<TDecorator>): TDecorator {
    if (!partial.kind) {
      throw new Error("TDecorator requires kind")
    }
    const targetIds = (partial.targetIds ?? []).filter((id): id is string => id !== undefined)
    const targetBounds = partial.targetBounds
    const decorator = DecoratorUtil.createDecorator(partial.kind, partial.style ?? {}, targetIds)
    // Read as the `TOBB` the field declares, field by field, rather than through `create`'s `TBox`
    // parameter. The code this replaces did `partial.bounds as TBox` and handed that to
    // `OBBOps.fromBox`, which reads `.x`/`.y` — so a decorator serialised by iinkTS itself (a
    // `TOBB`, with `center` and no `x`) came back with a NaN centre on re-import. The cast was what
    // hid the mismatch from the compiler.
    if (targetBounds) {
      DecoratorUtil.setTargetBounds(
        decorator,
        OBBOps.create(
          { x: targetBounds.center?.x ?? 0, y: targetBounds.center?.y ?? 0 },
          targetBounds.width ?? 0,
          targetBounds.height ?? 0,
          targetBounds.angle ?? 0
        )
      )
    }
    decorator.transform = mergeSymbolTransform(partial.transform)
    return decorator
  }

  /**
   * Deliberately nothing. A standalone decorator follows the symbols it decorates: the transform
   * manager composes their matrix onto it, or refits its box when only some of them moved — moving
   * the decorator itself as well would double the displacement. `IIAbstractTransformManager.applyToSymbol` still returns early
   * for decorators, so nothing calls this yet; it becomes the live path when IIC-2014 removes that
   * early return, and stating the exception here is what keeps it from being lost.
   *
   * Overriding `applyTransform` rather than `translate`/`rotate`/`resize` individually: those three
   * are concrete on `SymbolUtil` now and all three route through this one method, so a single
   * no-op here covers all three at once instead of three separate ones.
   */
  applyTransform(): void {}

  /**
   * A decorator's geometry is read, not derived: `targetBounds` is an input written by whoever
   * placed it (see `TDecorator.targetBounds`). This util is the one that reports a stored box
   * because it is the one type whose box does not come from coordinates it owns.
   *
   * No `targetBounds` means no box of its own — a decorator embedded in a `TText`/`TMath`, or
   * standalone but not yet placed. It reports empty rather than two phantom points at the origin,
   * which is what a zero-size box would produce.
   */
  /**
   * The box a decorator was placed against, as a shape.
   *
   * Its target's box rather than the line it draws: a decorator is found wherever what it decorates
   * is, which is what `DecoratorUtil.overlaps` tested against and what `targetBounds` holds. Filled,
   * so a query landing inside the decorated text catches it the way a query crossing the text's edge
   * does — again matching the box test this replaces.
   *
   * The box's own angle is handed over as the frame, so the corners come back as the very box that
   * was stored rather than as an axis-aligned one drawn around it.
   *
   * A decorator with no target has no place on the page, and an empty polygon overlaps nothing.
   */
  getGeometry(decorator: TDecorator): Geometry2d {
    const bounds = decorator.targetBounds
    return bounds ? new Polygon2d(OBBOps.toCorners(bounds), true, bounds.angle) : new Polygon2d([])
  }

  /** The two ends of the line it draws, carried by the matrix it took from its targets. */
  getSnapPoints(decorator: TDecorator): TPoint[] {
    return decorator.targetBounds
      ? this.mapPointsForward(decorator, DecoratorUtil.computeVertices(decorator.targetBounds))
      : []
  }

  canResize(_decorator: TDecorator): boolean {
    return false
  }

  canRotate(_decorator: TDecorator): boolean {
    return false
  }

  getSVGElement(decorator: TDecorator): SVGGeometryElement | undefined {
    return DecoratorUtil.renderFromBounds(
      decorator,
      SymbolGeometry.rawOf(decorator).bounds,
      decorator.baseline,
      decorator.xHeight,
      {
        width: decorator.style.width,
        color: decorator.style.color,
      }
    )
  }

  static renderForSymbol(decorator: TDecorator, symbol: TBaseSymbol): SVGGeometryElement | undefined {
    // `SymbolGeometry.rawOf`, not `boundsOf`: this element is drawn either as the decorator's own
    // top-level group (which carries its own `transform` below) or as a child of the host's group
    // (which carries the host's), so the geometry itself must stay untransformed — the enclosing
    // `transform` attribute is what repositions it, exactly once at each level. `rawOf` also keeps
    // this on the cache `boundsOf` uses, rather than rebuilding a util's geometry uncached on
    // every redraw.
    const bounds = decorator.targetBounds ? SymbolGeometry.rawOf(decorator).bounds : SymbolGeometry.rawOf(symbol).bounds
    return DecoratorUtil.renderFromBounds(decorator, bounds, undefined, undefined, {
      width: symbol.style.width,
      color: symbol.style.color,
    })
  }

  static renderFromBounds(
    decorator: TDecorator,
    bounds: TOBB,
    baseline?: number,
    xHeight?: number,
    symbolStyle?: {
      width?: number
      color?: string
    }
  ): SVGGeometryElement | undefined {
    const definition = DECORATOR_KINDS[decorator.kind]
    if (!definition) {
      // Skipped rather than thrown on, unlike the shape and edge utils: this runs over every
      // decorated symbol on every redraw, and one unknown kind must not abort the frame.
      return undefined
    }

    const attrs: { [key: string]: string } = {
      id: decorator.id,
      type: "decorator",
      kind: decorator.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (decorator.style.opacity) {
      attrs["opacity"] = decorator.style.opacity.toString()
    }
    if (!isIdentityMatrix(decorator.transform)) {
      attrs.transform = MatrixTransform.toCssString(decorator.transform)
    }
    // Layered after, so a kind may override a shared attribute. The highlight does exactly that.
    Object.assign(attrs, definition.attributes(decorator))

    const context: TDecoratorRenderContext = {
      box: OBBOps.toBox(bounds),
      strokeWidth: symbolStyle?.width || DefaultStyle.width,
      baseline,
      xHeight,
    }
    return definition.render(context, attrs)
  }

  static createDecorator(
    kind: DecoratorKind,
    style: TPartialDeep<TStyle>,
    targetIds: string[] = [],
    targetBounds?: TBox
  ): TDecorator {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const decorator: TDecorator = {
      id: `${kind}-${createUUID()}`,
      type: SymbolType.Decorator,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      kind,
      targetIds,
      transform: MatrixTransform.identity(),
    }
    if (targetBounds) {
      DecoratorUtil.setTargetBounds(decorator, OBBOps.fromBox(targetBounds))
    }
    return decorator
  }

  static setTargetBounds(decorator: TDecorator, targetBounds: TOBB): void {
    decorator.targetBounds = targetBounds
  }

  /**
   * Refits the box around `targets` (document coordinates), expressed in the decorator's own frame
   * so that the matrix it took from earlier transforms still places it.
   */
  static refitTargetBounds(decorator: TDecorator, targets: TOBB[]): void {
    const corners = targets
      .flatMap((obb) => OBBOps.toCorners(obb))
      .map((p) => applyInverseMatrixToPoint(p, decorator.transform))
      // A degenerate matrix (scaled to zero) has no local frame to express the box in.
      .filter((p): p is TPoint => !!p)
    DecoratorUtil.setTargetBounds(decorator, OBBOps.createFromPoints(corners))
  }

  /** The two endpoints of the horizontal line a decorator's own geometry is: the middle of its bounds. */
  static computeVertices(bounds: TOBB): TPoint[] {
    const yMid = bounds.center.y
    const hw = bounds.width / 2
    return [
      { x: bounds.center.x - hw, y: yMid },
      { x: bounds.center.x + hw, y: yMid },
    ]
  }
}
