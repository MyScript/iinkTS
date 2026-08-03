---
name: symbol-system
description: >
  Deep guide to the iinkTS symbol system: TSymbol union, type guards, the Ops/Util
  two-layer pattern, SymbolFactory, symbolRegistry. Use when writing type-safe symbol
  code, adding symbol behavior, or debugging type confusion between variants.
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

## Two layers of per-type logic

1. **`*Ops`** — pure functions/objects co-located with the type definition in `src/symbol/{type}/{Type}.ts`: `StrokeOps`, `TextOps`, `MathOps`, `DecoratorOps`, `EraserOps`, `BoxOps`, `ShapeOps`, `EdgeOps`. This is where `create`/update/overlap logic actually lives — usable standalone, no registry dependency.
2. **`*Util`** — adapter classes in `src/symbol-utils/{type}/{Type}Util.ts` (`StrokeUtil`, `TextUtil`, `MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil`), extending abstract `SymbolUtil`. Mostly delegate to the matching `*Ops`, plus implement `getSVGElement()` for rendering. All 6 register into `symbolRegistry` via `registerBuiltinSymbolUtils()`.

`SVGRenderer` dispatches rendering with `symbolRegistry.getUtil(symbol.type).getSVGElement(symbol)` — no `switch` on `SymbolType` in the renderer.

## Type Guards

Co-located with each type, not centralized:

```typescript
import { isStroke, isRecognizedMath, isRecognizedText } from "@/symbol/stroke/Stroke"
import { isText } from "@/symbol/text/Text"
import { isMath } from "@/symbol/math/Math"
import { isDecorator } from "@/symbol/decorator/Decorator"

// Narrow before accessing type-specific properties
if (isStroke(symbol)) {
  symbol.pointers  // now typed as TStroke
}
```

If a type guard you need doesn't exist, add it next to the type definition — never inline `symbol.type === "..."` checks.

**Note**: `src/symbol/SymbolHelpers.ts` is NOT a dispatcher — it only exports `cloneSymbol()` (via `structuredClone`). The real per-type dispatch is `symbolRegistry` in `src/symbol-utils/`.

## IIModel Interactions

`IIModel` stores symbols in a `Map<string, TSymbol>` (keyed by `symbol.id`):

```typescript
model.addSymbol(symbol)      // adds to map + updates bounding box cache
model.getSymbol(id)          // returns TSymbol | undefined
model.symbols                // returns TSymbol[] (from map values)
model.removeSymbol(id)
model.updateSymbol(symbol)   // replace by id
```

**Cache invalidation**: `IIModel` caches bounding boxes. After bulk mutations, call `model.resetBoundingBox()`.

## SymbolFactory

Use `SymbolFactory` (`src/symbol-utils/SymbolFactory.ts`) to create symbols — never construct a type literal directly:

```typescript
import { SymbolFactory } from "@/symbol-utils"
```

Creating symbols by hand bypasses ID generation and default style merging.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `symbol.type === "stroke"` inline check | Use `isStroke(symbol)` from `@/symbol/stroke/Stroke` |
| Assuming `SymbolHelpers` dispatches by type | It only has `cloneSymbol()` — use `symbolRegistry` |
| Branching on `SymbolType` in a manager/renderer | Add/extend the type's `*Ops`/`*Util` pair instead |
| Mutating `model.symbols` array directly | Use `model.addSymbol()` / `model.removeSymbol()` |
| Looking for per-type logic in `src/symbol/` only | Rendering + capability flags live in `src/symbol-utils/` |

## Adding a New Symbol Type

See the `add-symbol-type` skill for the full step-by-step (enum → type+Ops → Util adapter → registry → renderer → tests).
