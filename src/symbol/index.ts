/**
 * @group Symbol
 * @summary Symbol types and their type guards, organized by category
 *
 * A type file holds the type and its guards, nothing else: construction, geometry and rendering
 * live on the type's util in `symbol-utils` ({@link StrokeUtil}, {@link TextUtil}, {@link MathUtil},
 * {@link ShapeUtil}, {@link EdgeUtil}, {@link DecoratorUtil}).
 *
 * **Root** — {@link SymbolType}, {@link TBaseSymbol}, {@link TSymbol}
 *
 * **Stroke** — {@link TStroke}, {@link isStroke}
 *
 * **Text** — {@link TText}, {@link isText}
 *
 * **Math** — {@link TMath}, {@link isMath}
 *
 * **Typeset** — {@link TTypesetChild}
 *
 * **Decorator** — {@link TDecorator}, {@link DecoratorKind}, {@link isDecorator}
 *
 * **Eraser** — {@link TEraser}, {@link EraserOps} (a transient tool, not part of {@link TSymbol})
 *
 * **Shape** — {@link TShape}, {@link TShapeCircle}, {@link TShapeEllipse}, {@link TShapePolygon}
 *
 * **Edge** — {@link TEdge}, {@link TEdgeArc}, {@link TEdgeLine}, {@link TEdgePolyLine}, {@link TAnchor}
 *
 * **Legacy** (deprecated v1) — {@link Stroke}, {@link TLegacyStroke}
 *
 * Geometry primitives ({@link TPoint}, {@link TBox}, {@link BoxOps}) live in `core`.
 */

// Symbol categories
export * from "./decorator"
export * from "./edge"
export * from "./eraser"
export * from "./shape"
export * from "./stroke"
export * from "./typeset"

// Root union type + enum re-exports
export * from "./Symbol"

// Cross-type dispatchers
export * from "./SymbolHelpers"

// Legacy v1 symbols (deprecated)
export * from "./legacy"
