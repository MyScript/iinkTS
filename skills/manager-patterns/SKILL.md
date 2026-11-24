---
name: manager-patterns
description: >
  Patterns for creating and extending managers in iinkTS. Use when adding a new manager,
  extending IIAbstractTransformManager, or understanding manager dependencies and lifecycle.
---

# Manager Patterns

## Responsibility Rule

One manager = one responsibility. When a manager grows several unrelated concerns, extract a sub-manager (see `manager/interactive/math/`) or move per-type logic onto the symbol's util.

| Manager family | Location | Responsibility |
|----------------|----------|----------------|
| Base managers | `src/manager/base/` | Shared by several variants: `AbstractWriterManager`, `EraseManager`, `ExportManager`, `PDFExportManager`, `LayoutManager`, `ColorPaletteManager` |
| Simple managers | `src/manager/simple/` | `INK_V2` variant (`IWriterManager`) — its history is `IHistoryManager` in `src/history/` |
| Interactive managers | `src/manager/interactive/` | `INTERACTIVE_INK` variant (~20 managers) |
| Debug | `src/manager/debug/` | `IDebugSVGManager` |

## Creating a New Interactive Manager

Interactive managers extend `IIAbstractManager` (`src/manager/interactive/IIAbstractManager.ts`). They receive the **canvas** and read their dependencies from it through inherited getters — `model`, `renderer`, `client`, `configuration` — so a manager always sees the canvas's current instances.

```typescript
import type { TInteractiveInkCanvas } from "@/canvas"
import { LoggerCategory } from "@/logger"

import { IIAbstractManager } from "./IIAbstractManager"

export class IIMyFeatureManager extends IIAbstractManager {
  protected managerName = "IIMyFeatureManager"

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MANAGER)
  }

  async doThing(symbolId: string): Promise<void> {
    const symbol = this.model.getSymbol(symbolId)
    if (!symbol) return
    this.logger.info("doThing", { symbolId })
    // ... logic
  }

  protected onDestroy(): void {
    // remove listeners, clear timers
  }
}
```

Rules:
- Members `protected`, not `#private`, unless truly internal state: integrators subclass managers
- `this.logger` comes from the base (`LoggerManager.getLogger(category)`), pick the matching `LoggerCategory`
- Optional hooks: `onInit()` (end of the base constructor) and `onDestroy()` (called by `destroy()`)
- Async methods return `Promise<void>` or `Promise<T>`, never fire-and-forget
- No hidden side-effects — if you emit an event or mutate the model, it must be obvious from the method name
- Never mutate a committed symbol: `model.draftSymbol(id)` → change → `model.commitSymbol(draft)`

## Extending IIAbstractTransformManager

For managers that apply a geometric transform to symbols. The class is `IIAbstractTransformManager`, in `src/manager/interactive/transform/AbstractTransformManager.ts`:

```typescript
import type { MatrixTransform } from "@/core"
import { symbolRegistry } from "@/symbol-utils"
import type { TSymbol } from "@/symbol"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

export class IIMyTransformManager extends IIAbstractTransformManager {
  protected managerName = "IIMyTransformManager"

  // The one abstract member: delegate to the symbol's util, never switch on symbol.type
  protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void {
    symbolRegistry.getUtilFor(symbol).translate(symbol, { matrix })
  }
}
```

The base provides `applyMatrix(symbols, matrix)`, `applyToSymbol(symbol, matrix)`, live preview (`previewTransform`, `previewElementTransform`), history recording (`recordTransformed`), followed/anchored symbols and `finalizeTransform()`. Read an existing subclass before writing a new one.

Existing subclasses: `IITranslateManager`, `IIRotationManager`, `IIResizeManager`, orchestrated by `IITransformManager`.

## Manager Registration

Managers are instantiated in the `InteractiveInkCanvas` constructor with the canvas, and exposed as public properties:

```typescript
// In InteractiveInkCanvas.ts
this.myFeature = new IIMyFeatureManager(this)

// In destroy()
this.myFeature.destroy()
```

Also:
- declare the property on `TInteractiveInkCanvas` (`src/canvas/TInteractiveInkCanvas.ts`) — managers are typed against it, and `test/unit/__mocks__/createCanvasMock.ts` must provide it
- export the class from its folder barrel (`src/manager/interactive/index.ts`)
- call its `destroy()` from the canvas's `destroy()` if it holds listeners or timers

## Anti-Patterns

| Anti-pattern | Fix |
|--------------|-----|
| Caching `this.canvas.model` / `renderer` in a field | Use the inherited getters, they follow the canvas |
| Branching on `symbol.type` in a manager | Ask the util: `symbolRegistry.getUtilFor(symbol)` |
| Emitting events from inside a private helper | Emit only from public methods |
| `setTimeout` / fire-and-forget async | Return Promise, let caller await |
| Listener added without cleanup | Remove it in `onDestroy()` (or at the end of the gesture) |
| Logic > 20 lines in one method | Extract named helper |
