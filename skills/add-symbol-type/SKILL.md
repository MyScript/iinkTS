---
name: add-symbol-type
description: >
  Step-by-step guide to add a new symbol type to iinkTS. Use when implementing
  a new geometric primitive, annotation type, or any new TSymbol variant.
  Covers the full chain: type+Ops → Util adapter → registry → renderer → tests.
---

# Add Symbol Type

## When to Use

Adding any new symbol kind that must be stored in `IIModel`, rendered in SVG, and manipulated by managers.

## Two layers — know which one you're extending

1. **`*Ops`** — pure logic (create/update/overlap), co-located with the type in `src/symbol/{type}/{Type}.ts`. No dependency on rendering or the registry.
2. **`*Util`** — adapter in `src/symbol-utils/{type}/{Type}Util.ts`, extends abstract `SymbolUtil`, mostly delegates to the matching `*Ops`, adds `getSVGElement()`. Registered into `symbolRegistry` so `SVGRenderer` can dispatch without a `switch`.

## Steps

### 1. Add to `SymbolType` enum

`src/symbol/Symbol.ts`:
```typescript
export enum SymbolType {
  // ... existing ...
  YourType = "yourtype",
}
```

### 2. Create the type + Ops file

`src/symbol/yourtype/YourType.ts`:
```typescript
import type { TBaseSymbol } from "../Symbol"
import { SymbolType } from "../Symbol"

export type TYourType = TBaseSymbol & {
  type: SymbolType.YourType
  // primary geometry fields + stored derived fields (bounds, snapPoints, etc.)
}

export function isYourType(symbol: TBaseSymbol): symbol is TYourType {
  return symbol.type === SymbolType.YourType
}

export const YourTypeOps = {
  create(/* params */): TYourType { /* ... */ },
  createFromPartial(partial: TPartialDeep<TYourType>): TYourType { /* ... */ },
  updateDerivedFields(sym: TYourType): void { /* recompute bounds/snapPoints */ },
  overlaps(sym: TYourType, box: TBox): boolean { /* ... */ },
}
```

Model this on an existing type in the same family — `src/symbol/stroke/Stroke.ts` (`StrokeOps`) is the reference implementation.

### 3. Export from `src/symbol/index.ts`

```typescript
export * from "./yourtype"
```

### 4. Add to `TSymbol` union

`src/symbol/Symbol.ts`:
```typescript
export type TSymbol = TEdge | TShape | TStroke | TText | TMath | TDecorator | TYourType
```

### 5. Create the `*Util` adapter

`src/symbol-utils/yourtype/YourTypeUtil.ts`:
```typescript
import { SymbolUtil } from "../SymbolUtil"
import { SymbolType } from "@/symbol/Symbol"
import { YourTypeOps, type TYourType } from "@/symbol/yourtype/YourType"

export class YourTypeUtil extends SymbolUtil<TYourType> {
  readonly type = SymbolType.YourType

  create(partial) { return YourTypeOps.createFromPartial(partial) }
  updateDerivedFields(sym) { YourTypeOps.updateDerivedFields(sym) }
  overlaps(sym, box) { return YourTypeOps.overlaps(sym, box) }
  getSVGElement(sym) { /* build and return the SVGGraphicsElement */ }
}
```

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

- `test/unit/symbol/yourtype/YourType.test.ts` — `create()`, `createFromPartial()` with missing fields, `updateDerivedFields()`, `overlaps()` inside/outside box
- `test/unit/symbol-utils/yourtype/YourTypeUtil.test.ts` — adapter delegates correctly, `getSVGElement()` produces expected structure

## Checklist

- [ ] `SymbolType` enum updated
- [ ] Type + `*Ops` created in `src/symbol/{type}/`, with type guard
- [ ] Exported from `src/symbol/index.ts`
- [ ] Added to `TSymbol` union
- [ ] `*Util` adapter created in `src/symbol-utils/{type}/`, extends `SymbolUtil`
- [ ] Registered in `registerBuiltinSymbolUtils`
- [ ] Exported from `src/symbol-utils/index.ts`
- [ ] Manager handling verified
- [ ] Tests written (Ops + Util), ≥75% coverage
- [ ] `yarn typecheck` clean
- [ ] `yarn test:unit` passes
