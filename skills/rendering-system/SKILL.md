---
name: rendering-system
description: >
  Guide to the rendering architecture (SVGRenderer, per-type SVG through symbol utils, transforms,
  virtualization, styling). Use when modifying rendering logic, debugging visual issues, or
  implementing custom renderers.
---

# Rendering System Architecture

## Which renderer

The renderer is fixed by the canvas variant — there is no configuration option to switch it:

| Variant | Renderer | File |
|---|---|---|
| `INTERACTIVE_INK` (`InteractiveInkCanvas`) | `SVGRenderer` | [src/renderer/svg/SVGRenderer.ts](src/renderer/svg/SVGRenderer.ts) |
| `INK_V2` (`InkCanvas`) | `SVGRenderer` | same |
| `INTERACTIVE_INK_SSR` | `InteractiveInkSSRSVGRenderer` (applies server SVG patches) | [src/renderer/ssr/SVGSSRenderer.ts](src/renderer/ssr/SVGSSRenderer.ts) |
| `INK_V1` (deprecated) | `CanvasRenderer` (Canvas 2D) + `CanvasRendererStroke/Shape/Text` | [src/renderer/canvas/](src/renderer/canvas/) |

`SVGRenderer` and `CanvasRenderer` extend `BaseRenderer` ([src/renderer/base/BaseRenderer.ts](src/renderer/base/BaseRenderer.ts)); the SSR renderer is standalone. New rendering work targets `SVGRenderer`. Renderer configuration (`configuration.rendering`) only holds `minHeight`, `minWidth` and `guides` (`enable`, `gap`, and `type: "line" | "grid" | "point"` on the interactive variant).

## Per-type rendering — registry dispatch

`SVGRenderer` never switches on the symbol type. It asks the registry:

```typescript
// SVGRenderer.buildElementFromSymbol
const util = symbolRegistry.getUtil(symbol.type)
const element = util.getSVGElement(symbol)
```

Each type's util builds its element: `StrokeUtil`, `TextUtil`, `MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil` (`src/symbol-utils/{type}/`). A single-`<path>` type extends `PathSymbolUtil` and implements `getPathData` + `getPathAttributes` instead. Adding a renderable type = adding a util (see `add-symbol-type`), never touching `SVGRenderer`.

- Strokes are drawn as filled outlines shaped by the pen nib (`style.pen`: `ballpoint`, `pencil`, `fountain`, `brush` — `PEN_NIBS` in [src/style/PenNib.ts](src/style/PenNib.ts)), using pressure and speed
- Decorators are the recognized annotations on text (highlight, underline, strikethrough, surround) — not selection UI
- Selection, handles, snap lines, math badges and other overlays are drawn by managers (`IISelectionManager`, `IIOverlayManager`, `IISnapManager`…) with `SVGBuilder`; handle groups carry an `SvgElementRole` (`translate`, `resize`, `rotate`, `interact-elements-group`, `guide`)

**Building blocks**:
- `SVGBuilder` — element factory (`createPath`, `createLayer`, groups…); real implementation in [src/symbol-utils/SVGBuilder.ts](src/symbol-utils/SVGBuilder.ts), `src/renderer/svg/utils/SVGBuilder.ts` re-exports it
- `SVGRendererConst`, `GUIDE_PATH_ATTRS`, `SUB_GUIDE_PATH_ATTRS` — [src/renderer/svg/utils/SVGRendererConst.ts](src/renderer/svg/utils/SVGRendererConst.ts) (class names `ms-selected`, `ms-selection-halo`, `ms-deleting`, guide attributes)

## SVGRenderer structure

- `layer: SVGSVGElement` — the document: one element per symbol, plus `definitionGroup` (`<defs>`) and the guides group
- a separate current-symbol overlay (`drawCurrentSymbol` / `clearCurrentSymbolLayer`, `data-layer="CAPTURE"`) — the stroke being drawn is redrawn there every frame so the rest of the scene is not repainted
- viewport: `getZoom`/`setZoom`, `getViewBox`/`setViewBox`, `pan`, `ensurePointVisible`, `resize`

Main operations: `drawSymbol(symbol)`, `replaceSymbol(id, symbols)`, `removeSymbol(id)`, `changeOrderSymbol(symbol, position)`, `setSymbolTransform(symbol)`, `updateSelectedState(symbol, bool)`, `updateDeletingState(symbol, bool)`, `clear()`, `destroy()`. Drawing helpers for overlays: `drawCircle`, `drawRect`, `drawLine`, `drawConnectionBetweenBox`.

### Transforms

A transform writes `symbol.transform` (a `TMatrixTransform`) and nothing else: raw coordinates never move after creation. The renderer applies it by rewriting the element's `transform` attribute (`setSymbolTransform`, `MatrixTransform.toCssString`) instead of rebuilding the element — that is what keeps drags cheap and undo exact.

`MatrixTransform` ([src/core/geometry/Matrix.ts](src/core/geometry/Matrix.ts)) fields are `xx, yx, xy, yy, tx, ty`. Builders are instance methods returning a new matrix: `MatrixTransform.identity().translate(tx, ty).rotate(radian, center?).scale(x, y, center?)`, `multiply(m)`, `applyToPoint(point)`, `toCssString()`. Statics: `identity()`, `applyToPoint(mat, point)`, `rotation(mat)`, `toCssString(mat)`.

### Virtualization

Every drawn symbol is tracked with its element and bounds. Symbols outside the view box keep their built element out of the DOM; pan/zoom reconciles what is attached, and a symbol changed while off screen is rebuilt when it comes back into view. Don't assume `document.getElementById(symbol.id)` finds an off-screen symbol — use `renderer.getElementById`, or check the model.

## Bounds and geometry

A box is a plain record and its operations are free functions — there is no `Box` class ([src/core/geometry/Box.ts](src/core/geometry/Box.ts)):

```typescript
type TBox = { x: number; y: number; width: number; height: number }

BoxOps.createFromPoints(points)        // and createFromBoxes(boxes) — the union
BoxOps.containsPoint(box, point)       // contains(box, child), isContained(box, wrapper)
BoxOps.overlaps(box1, box2)
BoxOps.getCorners(box) / getSides(box) / getCenter(box) / getSnapPoints(box)
BoxOps.nearestBoundaryPoint(box, point)
```

A **symbol's** bounds do not come from here: ask its geometry, which is tight and knows about the transform — `SymbolGeometry.boundsOf(symbol)` returns a `TOBB`, and `OBBOps.toBox` flattens it to a `TBox` when a caller needs axis-aligned numbers.

## Styling

- **Per symbol**: `symbol.style` is a `TStyle` (`color`, `width`, `opacity`, `fill`, `pen`, `penAngle`, `penSmoothing`, `penSpeed`); `mergeSymbolStyle` fills defaults. Change it through the canvas (`updateSymbolsStyle` on `InkCanvas`, `updateSymbols(ids, { style })` on `InteractiveInkCanvas`), never by editing the element
- **Next strokes**: `canvas.penStyle = { color, width, pen }`
- **Theme / UI**: [src/iink.css](src/iink.css) is injected at runtime; on `InteractiveInkCanvas`, `configuration.cssVars` / `canvas.setCssVars(vars)` override the `--ms-ink-*` custom properties on the root element. Prefer CSS classes and variables over inline attributes
- **Legacy (`INK_V1`)**: `StyleManager` holds `penStyle` and `TTheme` (`ink`, `.math`, `.math-solved`, `.text`); `StyleHelper` ([src/style-css/StyleHelper.ts](src/style-css/StyleHelper.ts)) converts them between JSON and CSS (`themeToCSS`, `penStyleToCSS`, …)

## Debugging rendering

```javascript
// The SVG document of an interactive canvas
console.log(canvas.renderer.layer.outerHTML)

// Rendering follows model changes
canvas.event.addChangedListener((context) => console.log("changed", context))
```

- Symbol not visible → check `canvas.model.getSymbol(id)`, then `canvas.renderer.getElementById(id)` (it may be virtualized out of the view box), then its `transform` attribute
- Wrong shape after a move/rotate/resize → the bug is in the util's geometry or in `symbol.transform`, not in the element
- `IDebugSVGManager` (`src/manager/debug/`) draws recognition boxes on `InkCanvas`
- WebKit: SVG `filter: url(#…)` on strokes can crash the web process — use CSS filter classes

## Best Practices

✅ Put per-type drawing in the util, overlays in the manager that owns them
✅ Apply moves through `symbol.transform`, not by rewriting coordinates
✅ Build elements with `SVGBuilder`, style with CSS classes/variables
✅ Clean up overlay elements and listeners in the manager's `onDestroy()`

❌ Don't `switch` on `symbol.type` in the renderer or a manager
❌ Don't mutate a rendered element's geometry by hand — it is rebuilt from the symbol
❌ Don't target `CanvasRenderer` for new features (deprecated `INK_V1` only)
