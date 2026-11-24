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

`WebSocketSSRClient` is **not** a subclass of `WebSocketClient` — independent implementation, own config type. See the `client-system` skill for full protocol detail on `WebSocketClient`/`HTTPClientV2`.

## Steps

### 1. Define the interface contract

Reference `src/client/websocket/WebSocketClient.ts` for the full real surface (see the `client-system` skill for the verified method list — `addStrokes`, `eraseStrokes`, `replaceStrokes`, `transformTranslate/Rotate/Scale/Matrix`, `export`, `clear`, `undo`/`redo`, `close`, `destroy`). Minimum required for a stateful (WebSocket-style) client:

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

`src/client/<protocol>/YourClient.ts` (`http/` or `websocket/`):

```typescript
import { DeferredPromise } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"

import { ClientEvent } from "../shared/ClientEvent"
import { resolveHmac } from "../shared/HmacAuth"

export class YourClient {
  protected logger = LoggerManager.getLogger(LoggerCategory.CLIENT)
  event = new ClientEvent()
  initialized = new DeferredPromise<void>()

  constructor(configuration: TConfiguration) { ... }

  async init(): Promise<void> {
    // handshake, auth (resolveHmac if needed)
    this.initialized.resolve()
  }
}
```

Imports follow the `iink/barrel-imports` lint rule: other `src/` folders through their barrel (`@/core`, `@/logger`), relative paths inside `src/client/`. Members are `protected`, never `#private`: integrators subclass clients and pass them through `options.override.client`.

**Authentication**: Use `resolveHmac(server, message)` (`src/client/shared/HmacAuth.ts`): it calls `server.sign` (signature computed on the integrator's server, the production default) and falls back to a string `hmacKey` via `computeHmac(message, applicationKey, hmacKey)` — note the argument order, `message` comes first.

**Error handling**: Emit via `this.event.emitError(error)` — never throw uncaught. `ClientEvent` also exposes `CONNECTION_STATUS_CHANGED` for connectivity-state consumers.

### 3. Export from the protocol folder's barrel

`src/client/<protocol>/index.ts` (`src/client/index.ts` already re-exports every protocol folder):
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

### 5. Write tests

`test/unit/client/<protocol>/YourClient.test.ts`, mirroring the `src/` path (see `test/unit/client/websocket/WebSocketClient.test.ts`, `test/unit/client/http/HTTPClientV2.test.ts` for the real patterns). Import the library through `@/iink` only:
- Mock WebSocket (`jest-websocket-mock`, `test/unit/__mocks__/ServerWebSocketMock.ts`) or fetch (`jest-fetch-mock`)
- Test: init/handshake success and failure
- Test: `addStrokes()` sends correct message format
- Test: response parsing
- Test: error emission on transport failure
- Test: `destroy()` cleans up properly

## Checklist

- [ ] Client class created in `src/client/`
- [ ] `initialized: DeferredPromise<void>` exposed (stateful clients)
- [ ] `event: ClientEvent` exposed (stateful clients)
- [ ] HMAC auth wired if needed (`resolveHmac`)
- [ ] Members `protected`, not `#private`
- [ ] All errors emitted via `event.emitError()`, none thrown uncaught
- [ ] Exported from its folder barrel (`src/client/<protocol>/index.ts`)
- [ ] Canvas variant created if needed
- [ ] Registered in `CanvasFactory`
- [ ] Tests written (global threshold: 88% branches/lines/statements, 86% functions)
- [ ] `yarn lint` clean (barrel imports)
- [ ] `yarn typecheck` clean
