---
name: manager-patterns
description: >
  Patterns for creating and extending managers in iinkTS. Use when adding a new manager,
  extending AbstractTransformManager, or understanding dependency injection and manager lifecycle.
---

# Manager Patterns

## Responsibility Rule

One manager = one responsibility. If a manager exceeds ~200 lines, it's doing too much — extract a sub-manager or utility.

| Manager family | Location | Responsibility |
|----------------|----------|----------------|
| Base managers | `src/manager/base/` | Shared by all variants (ColorPalette, Erase) |
| Simple managers | `src/manager/simple/` | INKV2 variant (IWriterManager, IHistoryManager) |
| Interactive managers | `src/manager/interactive/` | INTERACTIVEINK variant (16+ managers) |

## Creating a New Manager

Minimal structure:

```typescript
import { LoggerManager, LoggerCategory } from "@/logger"
import type { IIModel } from "@/model"
import type { SVGRenderer } from "@/renderer/svg"

export class IIMyFeatureManager {
  #logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
  #model: IIModel
  #renderer: SVGRenderer

  constructor(model: IIModel, renderer: SVGRenderer) {
    this.#model = model
    this.#renderer = renderer
  }

  // Public API — all effects explicit
  async doThing(symbolId: string): Promise<void> {
    const symbol = this.#model.getSymbol(symbolId)
    if (!symbol) return
    // ... logic
  }
}
```

Rules:
- Private fields with `#` (not `_`)
- Logger always first private field
- Constructor receives dependencies — never reach for singletons
- Async methods return `Promise<void>` or `Promise<T>`, never fire-and-forget
- No hidden side-effects — if you emit an event or mutate model, it must be obvious from the method name

## Extending AbstractTransformManager

For managers that apply a geometric transform to symbols:

```typescript
import { AbstractTransformManager } from "@/manager/interactive/transform/AbstractTransformManager"
import type { TMyParams } from "./types"

export class IIMyTransformManager extends AbstractTransformManager<TMyParams> {
  // Template method — implement the actual transform
  protected applyToSymbol(symbol: TSymbol, params: TMyParams): TSymbol {
    // return transformed copy of symbol
  }
}
```

`AbstractTransformManager` handles: selection iteration, model update, renderer refresh, history push. You only implement `applyToSymbol`.

Existing subclasses: `IITranslateManager`, `IIRotationManager`, `IIResizeManager`.

## Using DeferredPromise for Initialization

When manager needs async setup before it can be used:

```typescript
import { DeferredPromise } from "@/utils/DeferredPromise"

export class IIMyManager {
  initialized = new DeferredPromise<void>()

  async init(): Promise<void> {
    await doAsyncSetup()
    this.initialized.resolve()
  }
}

// Caller:
await manager.initialized.promise
```

## Dependency Injection — What to Accept

Prefer narrow interfaces over concrete classes:

```typescript
// Good — accepts the interface
constructor(model: IIModel, renderer: SVGRenderer) {}

// Avoid — grabs canvas from global or passes whole canvas
constructor(canvas: InteractiveInkCanvas) {}
```

## Manager Registration

New managers are instantiated in `InteractiveInkCanvas` constructor and stored as public properties:

```typescript
// In InteractiveInkCanvas.ts
this.myFeature = new IIMyFeatureManager(this.model, this.renderer)
```

Export the manager class from `src/manager/index.ts` so consumers can type-hint it.

## Anti-Patterns

| Anti-pattern | Fix |
|--------------|-----|
| `this.canvas.model.getSymbol(id)` inside manager | Accept `model` in constructor |
| Emitting events from inside a private helper | Emit only from public methods |
| `setTimeout` / fire-and-forget async | Return Promise, let caller await |
| Manager calling another manager directly | Route through canvas or use events |
| Logic > 20 lines in one method | Extract named helper |
