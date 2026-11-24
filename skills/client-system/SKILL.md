---
name: client-system
description: >
  Understanding the client architecture (WebSocket vs HTTP, protocol flow, message handling).
  Use when working with backend communication, implementing new client features, or debugging
  recognition issues.
---

# Client System Architecture

## Overview

The client system handles communication with the MyScript Cloud backend for handwriting recognition. Lives in `src/client/`.

**Canvas variant → client mapping**:

| Client | Protocol | Used by |
|---|---|---|
| `WebSocketClient` | WebSocket | `InteractiveInkCanvas` |
| `WebSocketSSRClient` | WebSocket (separate class, own protocol additions e.g. `svgPatch`) | `InteractiveInkSSRCanvas` |
| `HTTPClientV2` | HTTP/REST, stateless batch | `InkCanvas` |
| `HTTPClientV1` | HTTP/REST, **deprecated** | `InkCanvasDeprecated` |

`WebSocketSSRClient` is **not** a subclass of `WebSocketClient` — it's an independent implementation with its own config type (`WebSocketSSRClientConfiguration`). This skill covers `WebSocketClient` and `HTTPClientV2/V1` in detail; consult `src/client/websocket/WebSocketSSRClient.ts` directly for SSR-specific protocol details.

## WebSocket Protocol Flow

**Implementation**: [src/client/websocket/WebSocketClient.ts](src/client/websocket/WebSocketClient.ts) — a sequence diagram already lives in the doc comment above the `WebSocketClient` class ("A websocket dialog have this sequence"), consult it first. The full message lifecycle is in `architecture/websocket-protocol.md`.

### 1. Connection + handshake

```typescript
// URL built in the constructor by serverUrl(server, "offscreen", { websocket: true, query })
// (src/client/shared/ServerConfiguration.ts):
// `${scheme}://${host}/api/v4.0/iink/offscreen?applicationKey=${applicationKey}`
// scheme is "wss" if server.scheme === "https", else "ws"

client.init()
```

Auth is a **message-field challenge/response**, not an HTTP header (that's HTTP-only, see below):

```typescript
// 1. Client → Server
→ { type: 'authenticate' }

// 2. Server → Client
← { type: 'hmacChallenge', hmacChallenge, iinkSessionId }

// 3. Client signs the challenge string (server.sign, or hmacKey in development) and replies
→ { type: 'hmac', hmac: await resolveHmac(server, hmacChallenge) }

← { type: 'authenticated' }

// 4. Session init (fresh) or restore (existing sessionId)
→ { type: 'initSession', ... }   // or { type: 'restoreSession', ... }
← { type: 'sessionDescription', ... }
```

**HMAC computation**: [src/client/shared/crypto.ts](src/client/shared/crypto.ts) — `computeHmac(message, applicationKey, hmacKey)`. Concatenates `applicationKey + hmacKey` as the HMAC-SHA-512 key (via WebCrypto `crypto.subtle`), signs `message`, hex-encodes. Clients go through `resolveHmac` ([src/client/shared/HmacAuth.ts](src/client/shared/HmacAuth.ts)), which prefers `server.sign` (signature from the integrator's server, key never in the browser) over a string `hmacKey`.

### 2. Recognition flow

```typescript
→ { type: 'addStrokes', ... }
→ { type: 'replaceStrokes', ... }

// Server pushes results — there is NO per-op ack like "strokesAdded"/"transformed"/"erased"
← { type: 'contentChanged', ... }

→ { type: 'export', ... }
← { type: 'exported', ... }
```

### 3. Interactive operations

```typescript
// Transform — ONE message type, differentiated by transformationType field
→ { type: 'transform', transformationType: 'TRANSLATE' | 'ROTATE' | 'SCALE' | 'MATRIX', ... }

// Erase — real type name, NOT "erase"
→ { type: 'eraseStrokes', strokeIds: [...] }

// Gesture recognition on an isolated stroke (not a generic "gestures" message)
→ { type: 'contextlessGesture', ... }
← { type: 'gestureDetected', ... }   // singular, not "gesturesDetected"

// Math solver — one message type, differentiated by `action` field
→ { type: 'mathSolver', action: 'available-actions' | 'numerical-computation' | 'get-diagnostic'
      | 'get-variables' | 'get-variable-value' | 'set-variable-value' | 'remove-variable-value'
      | 'as-variable-definition' | 'get-evaluables' | 'evaluate' | 'get-variable-definitions', ... }
← { type: 'mathSolverResult', ... }
```

There is **no `convert` message** on the WebSocket protocol — conversion is an `HTTPClientV1`-only concept (`HTTPClientV1.convert()`).

### 4. Session management

```typescript
→ { type: 'undo', changes: [...] }   // changes is an array of the same sub-messages
→ { type: 'redo', changes: [...] }   // (addStrokes/eraseStrokes/replaceStrokes/transform)

→ { type: 'clear' }

→ { type: 'ping' }
← { type: 'pong' }
```

There is **no `close`/`closed` JSON message**. Closing the session is a native `WebSocket.close(code, reason)` call, handled via the native `CloseEvent`, not a protocol message.

**Type definitions**: [src/client/websocket/WebSocketClientMessage.ts](src/client/websocket/WebSocketClientMessage.ts) — full server→client enum `TWebSocketClientMessageType`: `hmacChallenge, authenticated, sessionDescription, newPart, partChanged, configurationChanged, contentChanged, idle, pong, exported, gestureDetected, contextlessGesture, mathSolverResult, error, ack`.

### Event emission

Events go through `ClientEvent` (`src/client/shared/ClientEvent.ts`), enum `ClientEventName`:

```typescript
client.event.addContentChangedListener((evt) => { ... })
```

- `START_INITIALIZATION` / `END_INITIALIZATION`
- `CONTENT_CHANGED`, `IDLE`, `EXPORTED`, `ERROR`
- `CONNECTION_CLOSE`
- `SVG_PATCH` (WebSocket/SSR only)
- `SESSION_OPENED`
- `CONNECTION_STATUS_CHANGED` — `"connected" | "offline" | "error"`
- `GESTURE_DETECTED`

There is **no dedicated `CLEARED` event** — `clear()` just triggers the normal `contentChanged` flow.

## HTTP Protocol Flow (HTTPClientV2)

**Implementation**: [src/client/http/HTTPClientV2.ts](src/client/http/HTTPClientV2.ts)

Single entry point, no separate init/connect/export calls — HTTP is a stateless one-shot recognize:

```typescript
await client.send(strokes, requestedMimeTypes)  // sends + returns the result in one call
```

```
POST ${scheme}://${host}/api/v4.0/iink/recognize

Headers:
  applicationKey: <key>
  hmac: <computed over full JSON body>   // only if configured — HMAC-over-body+header, unlike WS challenge/response
  Content-Type: application/json
  Accept: <mimeType>
  # only if server.version >= 2.0.4:
  myscript-client-name: iink-ts
  myscript-client-version: <version>

Body (THTTPClientV2PostData):
{
  scaleX: 0.265, scaleY: 0.265,   // hardcoded
  configuration: { lang, <diagram|math|"raw-content"|text>, export },  // shape depends on recognition.type
  contentType: '...',
  strokes: [{ id, pointerType, x: [...], y: [...], t: [...], p: [...] }]
}

Response: dispatched on the response's own content-type header
  - image/* (pptx/png/jpeg) → blob()
  - application/json → json()
  - application/vnd.myscript.jiix → json(), falls back to text()
  - else → text()

Errors: non-OK response throws { code, message } (TApiError)
```

`HTTPClientV2` has **no** `addStrokes`, `transform`, `erase`, `undo`, `redo`, `close`, or `destroy` methods — those are WebSocket-only concepts.

### HTTPClientV1 (deprecated)

`src/client/http/HTTPClientV1.ts` — `@deprecated Use HTTPClientV2 instead`. Endpoint `/api/v4.0/iink/batch`. Body uses legacy `strokeGroups` (grouped by pen style) plus `xDPI`/`yDPI`/`height`/`width`/optional `conversionState` — materially different shape from V2. Uniquely exposes `convert(model, conversionState?, requestedMimeTypes?)` and `resize(model)`, neither of which exist on V2 or the WebSocket client.

## Message Handling Pattern: DeferredPromise

[src/core/std/DeferredPromise.ts](src/core/std/DeferredPromise.ts) — `.promise`/`.resolve`/`.reject`/`.isFullFilled`/`.isPending`. `WebSocketClient` tracks pending round trips with `waitForAnswer(key, neutral)`, keyed by a string (`export:<mimeType>`, a `blockId`…) since the protocol has no universal correlation id; the message handlers settle them by key (`answer()` / `settlePending()`):

```typescript
protected async sendExport(requestedMimeTypes?: string[]): Promise<TExport> {
  const mimeTypes = requestedMimeTypes || this.mimeTypes.slice()
  await this.send({ type: "export", partId: this.currentPartId, mimeTypes })
  const deferreds = mimeTypes.map((mt) => this.waitForAnswer(`export:${mt}`, {}))
  return Object.assign({}, ...(await Promise.all(deferreds.map((d) => d.promise))))
}
```

`export()` chains calls through `exportQueue`, so concurrent exports never interleave.

## Authentication summary

- **WebSocket**: message-field challenge/response (`hmacChallenge` → client replies `{ type: 'hmac', hmac }`). See flow above.
- **HTTP**: `resolveHmac(server, JSON.stringify(body))` (`src/client/http/HTTPRecognition.ts`) sent as a plain `hmac` request header alongside `applicationKey` header — no challenge round trip.
- Both: `server.sign` (signature from the integrator's server) in production, a string `hmacKey` only in development.

## Reconnection Strategy (WebSocketClient only)

One path, in `WebSocketClient.ts`, switched by `server.websocket.autoReconnect` (default true):

1. **Changes are queued** — `sendChange()` queues every change made while disconnected (`enqueueOfflineMessage`, max `offlineQueueMaxSize`) and `startReconnectLoop()` retries `init()` every `reconnectDelay` ms (default 3000) up to `maxReconnectAttempts` (default 10). On reconnect, `onConnected()` replays the queue in order (`drainOfflineQueue()`), then settles `reconnection`.
2. **Requests wait** — `send()` on a closed socket awaits `waitForReconnection()`, so a request goes after the replay; when the loop gives up (`giveUpReconnecting()`), the queue and the waiting requests reject and `CONNECTION_STATUS_CHANGED: "error"` is emitted.

Each `connect()` gets a fresh `initialized` and closes a socket a failed attempt left open; `connectingPromise` / `closingPromise` keep a reconnection from racing a deliberate `close()`/`newSession()`. `maxRetryCount` is read by `WebSocketSSRClient` only.

## Ping Worker (WebSocket Keep-Alive)

`src/worker/ping.worker.ts` — pure ticker, no server contact from the worker itself:

```typescript
// ping.worker.ts
self.addEventListener('message', (e: { data: { pingDelay: number } }) => {
  setInterval(() => postMessage({ type: 'ping' }), e.data.pingDelay)
})
```

Wired in `WebSocketClient.initPing()`: on each worker tick, sends a real `{ type: 'ping' }` WS message if `pingCount < maxPingLostCount`, else closes the socket with reason `MAXIMUM_PING_REACHED`. `pingCount` resets on any non-pong message or pong.

Config in `ServerConfiguration.ts` (`DefaultServerWebsocketConfiguration`): `pingEnabled` (default `true`), `pingDelay` (default `15000`ms), `maxPingLostCount` (default `20`).

## Testing Clients

`test/unit/client/` mirrors `src/client/`: `websocket/WebSocketClient.test.ts`, `websocket/WebSocketSSRClient.test.ts`, `http/HTTPClientV1.test.ts`, `http/HTTPClientV2.test.ts`, `shared/HmacAuth.test.ts`…

## Best Practices

✅ **Do** use `DeferredPromise` for async operations
✅ **Do** validate stroke data before sending
✅ **Do** handle `ERROR` and `CONNECTION_STATUS_CHANGED` events
✅ **Do** rely on the built-in reconnection (don't hand-roll another layer on top)
✅ **Do** clean up on destroy (`close()`, worker termination)

❌ **Don't** invent message types not in `TWebSocketClientMessageType` / the client→server literals in `WebSocketClient.ts`
❌ **Don't** mix HTTP and WebSocket clients on the same canvas instance
❌ **Don't** assume immediate recognition — wait for `contentChanged`/`idle`, there's no per-op ack
❌ **Don't** call `HTTPClientV2`-only stateless patterns (single `send()`) on a WebSocket client or vice versa
