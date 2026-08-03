---
name: add-client
description: >
  Checklist for adding a new client to iinkTS. Use when implementing
  a new communication protocol variant (HTTP batch, WebSocket, custom backend).
  Covers interface contract, package setup, and integration with canvas variants.
---

# Add Client

## Client Role

Clients handle the transport layer between iinkTS and a MyScript-compatible backend. They translate model mutations (add strokes, erase, transform) into protocol messages and dispatch recognition results back to the canvas. Lives in `src/client/`.

## Current Clients

| Class | Protocol | Used by |
|---|---|---|
| `WebSocketClient` | WebSocket | `InteractiveInkCanvas` |
| `WebSocketSSRClient` | WebSocket (separate class, own protocol additions) | `InteractiveInkSSRCanvas` |
| `HTTPClientV2` | HTTP REST, stateless batch | `InkCanvas` |
| `HTTPClientV1` | HTTP REST (deprecated) | `InkCanvasDeprecated` |

`WebSocketSSRClient` is **not** a subclass of `WebSocketClient` — independent implementation, own config type. See `recognizer-system` skill for full protocol detail on `WebSocketClient`/`HTTPClientV2`.

## Steps

### 1. Define the interface contract

Reference `src/client/WebSocketClient.ts` for the full real surface (see `recognizer-system` skill for the verified method list — `addStrokes`, `eraseStrokes`, `replaceStrokes`, `transformTranslate/Rotate/Scale/Matrix`, `export`, `clear`, `undo`/`redo`, `close`, `destroy`). Minimum required for a stateful (WebSocket-style) client:

```typescript
interface IYourClient {
  readonly url: string
  readonly configuration: TConfiguration
  send(message: object): Promise<void>
  addStrokes(strokes: TStroke[], processGestures?: boolean): Promise<void>
  eraseStrokes(strokeIds: string[]): Promise<void>
  clear(): Promise<void>
  close(code: number, reason: string): Promise<void>
  destroy(): Promise<void>
  // events
  event: ClientEvent
  // deferred
  initialized: DeferredPromise<void>
}
```

A stateless (HTTP-batch-style) client needs far less: see `HTTPClientV2` — a single `send(strokes, requestedMimeTypes?): Promise<TExportV2>` entry point is enough, no `init`/`close`/`destroy`/event surface required.

### 2. Create the client file

`src/client/YourClient.ts`:

```typescript
import { LoggerManager, LoggerCategory } from "@/logger"
import { DeferredPromise } from "@/utils/DeferredPromise"
import { ClientEvent } from "./ClientEvent"

export class YourClient {
  #logger = LoggerManager.getLogger(LoggerCategory.CLIENT)
  event = new ClientEvent()
  initialized = new DeferredPromise<void>()

  constructor(configuration: TConfiguration) { ... }

  async init(): Promise<void> {
    // handshake, auth (HMAC via computeHmac if needed)
    this.initialized.resolve()
  }
}
```

**Authentication**: Use `computeHmac(message, applicationKey, hmacKey)` from `@/utils/crypto` — note the argument order, `message` comes first.

**Error handling**: Emit via `this.event.emitError(error)` — never throw uncaught. `ClientEvent` also exposes `CONNECTION_STATUS_CHANGED` for connectivity-state consumers.

### 3. Export from client index

`src/client/index.ts`:
```typescript
export * from "./YourClient"
```

### 4. Create a canvas variant (if needed)

If the client requires a dedicated canvas variant:

`src/canvas/variants/YourCanvas.ts` — extend `AbstractCanvas` (`src/canvas/AbstractCanvas.ts`) or copy the pattern from `InkCanvas.ts`.

Register in `src/canvas/CanvasFactory.ts` (`CanvasFactory.createCanvas()`):
```typescript
case "YOURTYPE":
  instance = new YourCanvas(rootElement, options)
  break
```

Add `"YOURTYPE"` to `TCanvasType` in `src/canvas/AbstractCanvas.ts`, and to `TCanvasVariantMap`/`TCanvasOptionsMap` in `src/canvas/CanvasFactory.ts`.

### 5. Future: monorepo package split

When client packages are split (planned), the structure will be:

```
packages/
  client-websocket/      → WebSocketClient
  client-websocket-ssr/  → WebSocketSSRClient
  client-http-v2/        → HTTPClientV2
  client-http-v1/        → HTTPClientV1 (deprecated)
```

Each package will have its own `package.json` with peer dep on `iink-ts` core.

At that point, add a `package.json` and barrel `index.ts` to the package directory, and reference it from the root `package.json` `workspaces` field.

### 6. Write tests

`test/unit/client/YourClient.test.ts` (see existing `WebSocketClient.test.ts`, `HTTPClientV2.test.ts` for the real patterns in `test/unit/client/`):
- Mock WebSocket or fetch (see `test/unit/__config__/`)
- Test: init/handshake success and failure
- Test: `addStrokes()` sends correct message format
- Test: response parsing
- Test: error emission on transport failure
- Test: `destroy()` cleans up properly

## Checklist

- [ ] Client class created in `src/client/`
- [ ] `initialized: DeferredPromise<void>` exposed (stateful clients)
- [ ] `event: ClientEvent` exposed (stateful clients)
- [ ] HMAC auth wired if needed (`computeHmac`)
- [ ] All errors emitted via `event.emitError()`, none thrown uncaught
- [ ] Exported from `src/client/index.ts`
- [ ] Canvas variant created if needed
- [ ] Registered in `CanvasFactory`
- [ ] Tests written (≥80% coverage)
- [ ] `yarn typecheck` clean
