---
name: canvas-drawing-patterns
description: Canvas/ink-editor architecture checklist (manager lifecycle, API design, geometry perf) adapted for iinkTS from tldraw/excalidraw conventions. Invoke when adding or reviewing managers, renderer code, or hit-testing/geometry logic.
---

# Canvas/Drawing-App Patterns

## Manager lifecycle

A manager that adds an event listener or holds a resource (timer, subscription) MUST implement `destroy()` and get called on editor teardown.

Verify before adding a new listener: `grep -rl "addEventListener\|addListener" src/manager` then confirm each hit overrides `destroy()` from `IIAbstractManager`. Managers currently holding listeners: `IIOverlayManager`, `IDebugSVGManager`, `IIKeyboardManager`, `IISelectionManager` — check their cleanup coverage before extending them.

## API design

Avoid boolean or ambiguous positional params on new public methods — use a named options object. A bare `true`/`false` at a call site forces the reader to check the signature to know what it means.

```typescript
// bad
resize(el, true, false)
// good
resize(el, { preserveAspectRatio: true, animate: false })
```

## Geometry / perf

- Use `computeDistanceSquared` (no sqrt), not `computeDistance`, when only comparing against a threshold — already in `src/utils/geometry.ts`.
- Cache bounding boxes when queried repeatedly per frame/gesture instead of recomputing from raw points each time.

## Per-symbol-type encapsulation

Keep type-specific logic in the matching `*Ops` object (`StrokeOps`, `TextOps`, `MathOps`, `ShapeOps`, `EdgeOps`, `DecoratorOps` — co-located with the type in `src/symbol/{type}/`), and rendering/registry glue in the matching `*Util` adapter (`src/symbol-utils/{type}/`), dispatched via `symbolRegistry.getUtil(symbol.type)`. Don't branch on `SymbolType` inline in managers or renderers. `src/symbol/SymbolHelpers.ts` is unrelated (just `cloneSymbol()`), not a dispatcher.

## Testing

Prefer asserting whole objects (`toEqual(fullObject)`) over field-by-field checks when it gives a clearer failure diff.
