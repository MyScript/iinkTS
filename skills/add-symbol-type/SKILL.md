---
name: add-symbol-type
description: >
  Step-by-step guide to add a new symbol type to iinkTS. Use when implementing
  a new geometric primitive, annotation type, or any new TSymbol variant.
  Covers the full chain: type file → util → registry → renderer → tests.
---

# Add Symbol Type

## When to Use

Adding any new symbol kind that must be stored in `IIModel`, rendered in SVG, and manipulated by managers.

## Where things go

- `src/symbol/{type}/{Type}.ts` — **the type and its guards, nothing else**.
- `src/symbol-utils/{type}/{Type}Util.ts` — **everything the type knows**. Extends `SymbolUtil`
  (or `PathSymbolUtil` if you draw a single `<path>`). Instance methods are what the registry
  dispatches; statics are construction and editing, which have no symbol to dispatch on.

There is no `*Ops` object for a symbol. Registered into `symbolRegistry` so `SVGRenderer` dispatches
without a `switch`.

## Steps

### 1. Add to `SymbolType` enum

`src/symbol/Symbol.ts`:
```typescript
export enum SymbolType {
  // ... existing ...
  YourType = "yourtype",
}
```

### 2. Create the type file

`src/symbol/yourtype/YourType.ts` — the type and its guard, and that is all. **No stored geometry**:
bounds, vertices, snap points and edges are computed on read from the util's `getGeometry`.

```typescript
import type { TBaseSymbol } from "../Symbol"
import { SymbolType } from "../Symbol"

export type TYourType = TBaseSymbol & {
  type: SymbolType.YourType
  // the coordinates you own — nothing derived from them
}

export function isYourType(symbol: TBaseSymbol): symbol is TYourType {
  return symbol.type === SymbolType.YourType
}
```

Model this on an existing type in the same family — `src/symbol-utils/stroke/StrokeUtil.ts` is the reference implementation, and `src/symbol/stroke/Stroke.ts` shows how little the type file holds.

### 3. Export from `src/symbol/index.ts`

```typescript
export * from "./yourtype"
```

### 4. Add to `TSymbol` union

`src/symbol/Symbol.ts`:
```typescript
export type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator | TYourType
```

### 5. Create the util

`src/symbol-utils/yourtype/YourTypeUtil.ts`. Four abstract members are required (`type`, `create`, `getGeometry`, `getSVGElement`); everything else is inherited. Cross-folder imports go through the barrel (`iink/barrel-imports` lint rule):

```typescript
import { BoxOps, type Geometry2d, Polygon2d, type TPartialDeep } from "@/core"
import { SymbolType, type TYourType } from "@/symbol"

import { SymbolUtil } from "../SymbolUtil"

export class YourTypeUtil extends SymbolUtil<TYourType> {
  readonly type = SymbolType.YourType

  create(partial) { return YourTypeUtil.createFromPartial(partial) }

  // Say what shape you are; overlap, containment, distance and bounds follow from it.
  getGeometry(symbol: TYourType): Geometry2d {
    return new Polygon2d(BoxOps.getCorners(/* … */))
  }

  getSVGElement(symbol: TYourType) { /* build and return the SVGGraphicsElement */ }

  // Construction and editing are statics: there is no symbol yet to dispatch on.
  static createFromPartial(partial: TPartialDeep<TYourType>): TYourType { /* … */ }
}
```

Pick the geometry that describes what you draw — `Polygon2d` (closed), `Polyline2d` (open),
`PointSet2d` (caught only where a sample lands), `Circle2d`, `Ellipse2d`. If you draw a single
`<path>`, extend `PathSymbolUtil` instead and implement `getPathData` + `getPathAttributes` rather
than `getSVGElement`.

Reference: `src/symbol-utils/stroke/StrokeUtil.ts`.

### 6. Register in `registerBuiltinSymbolUtils`

`src/symbol-utils/registerBuiltinSymbolUtils.ts`:
```typescript
symbolRegistry.register(new YourTypeUtil())
```

### 7. Export from `src/symbol-utils/index.ts`

```typescript
export * from "./yourtype/YourTypeUtil"
```

### 8. Handle in managers (if needed)

Check which managers need to handle the new type:
- `IISelectionManager` — if selectable/transformable
- `IISnapManager` — if snappable (uses `getSnapPoints()`)
- `IIMoveManager` — if moveable
- Transform managers — if resizable/rotatable (override `canSelect`/`canTransform`/`canResize`/`canRotate` on the `Util` if the type has different capabilities than the defaults)

### 9. Write tests

Import everything through `@/iink` (unit tests never import `@/symbol` or deeper paths).

- `test/unit/symbol/yourtype/YourType.test.ts` — the guard
- `test/unit/symbol-utils/yourtype/YourTypeUtil.test.ts` — `create()`, `createFromPartial()` with missing fields, `getGeometry()` / `overlaps()` inside/outside box, `getSVGElement()` produces expected structure

## Checklist

- [ ] `SymbolType` enum updated
- [ ] Type + guard created in `src/symbol/{type}/` — no stored geometry
- [ ] Exported from `src/symbol/index.ts`
- [ ] Added to `TSymbol` union
- [ ] Util created in `src/symbol-utils/{type}/`, extends `SymbolUtil` (or `PathSymbolUtil`), with `getGeometry`
- [ ] Registered in `registerBuiltinSymbolUtils`
- [ ] Exported from `src/symbol-utils/index.ts`
- [ ] Manager handling verified
- [ ] Tests written (global threshold: 88% branches/lines/statements, 86% functions)
- [ ] `yarn typecheck` and `yarn lint` clean
- [ ] `yarn test:unit` passes
