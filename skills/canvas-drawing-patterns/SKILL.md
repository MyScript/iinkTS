---
name: canvas-drawing-patterns
description: Canvas/ink-editor architecture checklist for iinkTS (manager lifecycle, API design, geometry perf). Invoke when adding or reviewing managers, renderer code, or hit-testing/geometry logic.
---

# Canvas/Drawing-App Patterns

## Manager lifecycle

A manager that adds an event listener or holds a resource (timer, subscription) MUST release it — in the `onDestroy()` hook of `IIAbstractManager` (called by `destroy()`), or at the end of the gesture for per-drag listeners — and its `destroy()` must be called from the canvas's `destroy()`.

Verify before adding a new listener: `grep -rl "addEventListener\|addListener" src/manager` then confirm each hit removes it. Managers currently holding listeners: `IIOverlayManager`, `IDebugSVGManager`, `IIKeyboardManager` (`attach`/`detach`), `IISelectionManager` (per gesture), `PDFExportManager` — check their cleanup coverage before extending them.

## API design

Avoid boolean or ambiguous positional params on new public methods — use a named options object. A bare `true`/`false` at a call site forces the reader to check the signature to know what it means.

```typescript
// bad
resize(el, true, false)
// good
resize(el, { preserveAspectRatio: true, animate: false })
```

## Geometry / perf

- Use `computeDistanceSquared` (no sqrt), not `computeDistance`, when only comparing against a threshold — already in `src/core/geometry/distance.ts`.
- Cache bounding boxes when queried repeatedly per frame/gesture instead of recomputing from raw points each time.

## Per-symbol-type encapsulation

Keep everything a type knows on its util in `src/symbol-utils/{type}/` — geometry, rendering, construction and editing alike — and reach it through `symbolRegistry.getUtil(symbol.type)`. `src/symbol/{type}/` holds the type and its guards, nothing more. Don't branch on `SymbolType` inline in managers or renderers. `src/symbol/SymbolHelpers.ts` is unrelated (just `cloneSymbol()`), not a dispatcher.

## Testing

Prefer asserting whole objects (`toEqual(fullObject)`) over field-by-field checks when it gives a clearer failure diff.
