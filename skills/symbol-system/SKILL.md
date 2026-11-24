---
name: symbol-system
description: >
  Deep guide to the iinkTS symbol system: TSymbol union, type guards, the util that
  holds everything a type knows, Geometry2d, SymbolFactory, symbolRegistry. Use when
  writing type-safe symbol code, adding symbol behavior, or debugging type confusion
  between variants.
---

# Symbol System

## Hierarchy

```
TSymbol (union, src/symbol/Symbol.ts)
├── TStroke     — raw ink stroke
├── TText       — recognized text
├── TMath       — math formula
├── TDecorator  — edge/arrow decorator
├── TEdge (union) — TEdgeLine, TEdgeArc, TEdgePolyLine, TAnchor (smart connectors)
└── TShape (union) — TShapeCircle, TShapeEllipse, TShapePolygon
```

**Not in `TSymbol`**: `TEraser` (separate), legacy `Stroke`/`CanvasSymbol` (deprecated v1, `src/symbol/legacy/`), `TPoint`/`TBox`/`OBB` (primitives).

## One place per type: the util

`src/symbol/{type}/{Type}.ts` holds the **type and its guards, and nothing else**.

`src/symbol-utils/{type}/{Type}Util.ts` holds **everything a type knows** — `StrokeUtil`, `TextUtil`,
`MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil`, all extending `SymbolUtil`. Instance methods are
the contract the registry dispatches (`getGeometry`, `getSVGElement`, `canSelect`…); statics are
construction and editing, which have no symbol to dispatch on — `StrokeUtil.createEmpty`,
`ShapeUtil.createCircleBetweenPoints`, `EdgeUtil.moveLineVertex`. All 6 register via
`registerBuiltinSymbolUtils()`.

There is **no `*Ops` object for a symbol any more**. The two that remain are not symbols: `BoxOps` and
`OBBOps` are geometry primitives, and `EraserOps` belongs to a transient tool with no util.

A type describes its shape with `getGeometry(symbol): Geometry2d` and inherits overlap, containment
and distance from it — see `src/core/geometry/shapes/`.

`SVGRenderer` dispatches rendering with `symbolRegistry.getUtil(symbol.type).getSVGElement(symbol)` — no `switch` on `SymbolType` in the renderer.

## Type Guards

Co-located with each type, not centralized:

Defined in `src/symbol/stroke/Stroke.ts` (`isStroke`, `isRecognizedMath`, `isRecognizedText`, `isStrokeSolverOutput`), `src/symbol/typeset/Text.ts` (`isText`), `src/symbol/typeset/Math.ts` (`isMath`), `src/symbol/decorator/Decorator.ts` (`isDecorator`). Import them through the barrel (`iink/barrel-imports` lint rule):

```typescript
import { isDecorator, isMath, isStroke, isText } from "@/symbol"

// Narrow before accessing type-specific properties
if (isStroke(symbol)) {
  symbol.pointers  // now typed as TStroke
}
```

If a type guard you need doesn't exist, add it next to the type definition — never inline `symbol.type === "..."` checks.

**Note**: `src/symbol/SymbolHelpers.ts` is NOT a dispatcher — it only exports `cloneSymbol()` (via `structuredClone`). The real per-type dispatch is `symbolRegistry` in `src/symbol-utils/`.

## IIModel Interactions

`IIModel` keeps symbols in a `SymbolStore` (`src/store/`), in stacking order. Committed records are **frozen**: never mutate one, draft it and commit it back.

```typescript
model.getSymbol(id)                 // TSymbol | undefined — the frozen record
model.symbols                       // TSymbol[] in stacking order (the records themselves)
model.symbolCount                   // count without building the list
model.addSymbol(symbol)
const draft = model.draftSymbol(id) // mutable copy (TDraft<TSymbol>)
model.commitSymbol(draft)           // stores it back, same position, bumps modificationDate
model.updateSymbol(symbol)          // replace by id
model.replaceSymbol(id, symbols)
model.changeOrderSymbol(id, position)
model.removeSymbol(id)
```

Geometry (bounds, vertices…) is not stored on the model or the symbol: ask `SymbolGeometry` (`src/symbol-utils/SymbolGeometry.ts`), which caches a `Geometry2d` per frozen record. On a canvas, prefer `canvas.addSymbol`/`updateSymbol`/`removeSymbol` — they also render, sync the backend and record history.

## SymbolFactory

`src/symbol-utils/SymbolFactory.ts` holds two functions (no class) that ask the registry which util owns `partial.type` — never construct a type literal directly:

```typescript
import { createSymbolFromPartial, createSymbolsFromPartial } from "@/symbol-utils"

const symbol = createSymbolFromPartial({ type: "shape", kind: "circle", /* … */ })
const symbols = createSymbolsFromPartial(partials) // accumulates errors, throws once
```

Requires `registerBuiltinSymbolUtils()` to have run (canvases do it in `initialize()`). For a known type, the util's statics work too (`StrokeUtil.createEmpty`, `ShapeUtil.createCircleBetweenPoints`). Creating symbols by hand bypasses ID generation and default style merging.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `symbol.type === "stroke"` inline check | Use `isStroke(symbol)` from `@/symbol` |
| Assuming `SymbolHelpers` dispatches by type | It only has `cloneSymbol()` — use `symbolRegistry` |
| Branching on `SymbolType` in a manager/renderer | Add/extend the type's util instead |
| Mutating a record from `model.symbols` / `getSymbol()` (frozen) | `draftSymbol(id)` → change → `commitSymbol(draft)` |
| Looking for per-type logic in `src/symbol/` only | Rendering + capability flags live in `src/symbol-utils/` |

## Adding a New Symbol Type

See the `add-symbol-type` skill for the full step-by-step (enum → type + guard → util → registry → renderer → tests).
