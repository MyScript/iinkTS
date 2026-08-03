---
name: debug-websocket
description: >
  Diagnostic guide for tracing and debugging WebSocket exchanges between iinkTS
  and the MyScript server. Use when recognition fails silently, messages are lost,
  strokes are not recognized, or the session drops unexpectedly.
---

# Debug WebSocket

Applies to `WebSocketClient` (`src/client/WebSocketClient.ts`), used by `InteractiveInkCanvas`. `InteractiveInkSSRCanvas` uses the separate `WebSocketSSRClient` class — check `src/client/WebSocketSSRClient.ts` directly for SSR-specific behavior not covered here.

## Quick Diagnostic Checklist

1. **Is the connection open?** Check `canvas.client.initialized.promise` resolves.
2. **Is the session authenticated?** Look for the `hmacChallenge` → `hmac` → `authenticated` exchange (see flow below).
3. **Are strokes being sent?** Enable verbose logs (see below).
4. **Is the server responding?** Check for `contentChanged` messages.
5. **Did the socket close unexpectedly?** Check the close code against the table below (`src/client/ClientError.ts`).

## Enable Verbose Logging

```typescript
import { LoggerManager, LoggerCategory, LoggerLevel } from "iink-ts"

// Increase log level for the client only
LoggerManager.setLoggerLevel(LoggerCategory.CLIENT, LoggerLevel.DEBUG)
```

Logs are structured objects, not string-prefixed lines (`src/logger/logger.ts`):
```js
{ level: "debug", from: "CLIENT.messageCallback", message: [...] }
```
Filter the console on `from: "CLIENT."` to isolate client logs.

## Browser DevTools — Network Tab

1. Open DevTools → Network → WS filter
2. Find the connection to `wss://cloud.myscript.com/api/v4.0/iink/offscreen?applicationKey=...`
3. Click the connection → Messages tab

**Message flow (happy path)** — verified against `WebSocketClient.ts`:
```
→ authenticate
← hmacChallenge         (server sends { hmacChallenge, iinkSessionId })
→ hmac                  (client sends computeHmac(hmacChallenge, applicationKey, hmacKey))
← authenticated
→ initSession           (or restoreSession if a sessionId already exists)
← sessionDescription
→ addStrokes
← contentChanged        (no per-op ack — there's no "strokesAdded" message)
→ export
← exported
```

There is no `newContentPackage`/`configuration`/`waitForIdle`→`idle` handshake pair as a distinct step in that order — `waitForIdle()` is a client-side promise that resolves once an `idle` message arrives, callable any time, not part of the initial handshake.

**Auth message shapes** (`WebSocketClientMessage.ts`):
```json
// server → client
{ "type": "hmacChallenge", "hmacChallenge": "<challenge-string>", "iinkSessionId": "<id>" }

// client → server
{ "type": "hmac", "hmac": "<computed-hash>" }
```

If the `hmac` reply is wrong, the server closes the socket (see close codes below) rather than sending a dedicated "auth failure" message type.

## Common Error Patterns — Close Codes

Real codes are standard WebSocket close codes, mapped in `mapCloseCodeToMessage()` (`src/client/ClientError.ts`) — **not** custom 4xxx application codes:

| Close Code | `ClientError` | Meaning |
|---|---|---|
| `1000` | — | Normal closure |
| `1001` | `GOING_AWAY` | Server going away / browser navigating off the page |
| `1002` | `PROTOCOL_ERROR` | Server terminated the connection due to a protocol error |
| `1003` | `UNSUPPORTED_DATA` | Endpoint received data of a type it can't accept |
| `1006` | `ABNORMAL_CLOSURE` | MyScript recognition server not reachable |
| `1007` | `INVALID_FRAME_PAYLOAD` | Message contained inconsistent data (e.g. non-UTF-8) |
| `1008` | `POLICY_VIOLATION` | Message violates server policy |
| `1009` | `MESSAGE_TOO_BIG` | Data frame too large |
| `1011` | `INTERNAL_ERROR` | Server encountered an unexpected condition |
| `1012` | `SERVICE_RESTART` | Server is restarting |
| `1013` | `TRY_AGAIN` | Server temporarily overloaded, casting off clients |
| `1014` | `BAD_GATEWAY` | Server acting as gateway/proxy got an invalid upstream response |
| `1015` | `TLS_HANDSHAKE` | TLS handshake failure |

`ClientError` also defines session-level messages not tied to a WS close code: `NO_ACTIVITY` (auto-closed after an hour idle), `WRONG_CREDENTIALS`, `TOO_OLD` (max session duration reached), `NO_SESSION_FOUND`, `UNKNOWN`, `CANT_ESTABLISH`.

Fix guidance:
- `1006`/`CANT_ESTABLISH` → check network/host reachability, let the built-in reconnection run (see Reconnection below) rather than hand-rolling retry logic.
- `WRONG_CREDENTIALS` → check `applicationKey`/`hmacKey` in `configuration.server`.
- `NO_SESSION_FOUND`/`TOO_OLD` → re-`init()` a new session; export first if you need to preserve content (`ClientError.NO_SESSION_FOUND` message explicitly recommends export-then-reimport to avoid losing work).

## Trace Recognition Pipeline in Code

```typescript
// 1. Where strokes enter the client
// src/client/WebSocketClient.ts → addStrokes()

// 2. Where the raw message is parsed and dispatched
// src/client/WebSocketClient.ts → protected messageCallback() (line ~587)
// Unknown message types log a warning: "Message type unknown: ..."

// 3. Where the export/content update reaches the canvas
// src/canvas/variants/InteractiveInkCanvas.ts → protected onContentChanged()
// wired via: this.client.event.addContentChangedListener(this.onContentChanged.bind(this))

// 4. Managers react from there (e.g. src/manager/interactive/IISynchronizerManager.ts)
```

## Intercept Messages at Runtime

Temporary debug snippet (remove before commit):
```typescript
const client = canvas.client // WebSocketClient instance, exposed as a public property
const rawSend = client.socket.send.bind(client.socket)
client.socket.send = (data) => {
  console.log("[→ WS SEND]", JSON.parse(data))
  rawSend(data)
}
client.socket.addEventListener("message", (e) => {
  console.log("[← WS RECV]", JSON.parse(e.data))
})
```

## Ping / Heartbeat

`src/worker/ping.worker.ts` is a pure ticker: it receives `{ pingDelay }` once and then posts `{ type: 'ping' }` back on every interval — it never talks to the server itself. `WebSocketClient.initPing()` is what actually sends the WS `{ type: 'ping' }` message on each tick and expects a `pong` back.

- Config: `configuration.server.websocket.pingEnabled` (default `true`), `pingDelay` (default `15000`ms — **not** 30s), `maxPingLostCount` (default `20`) — see `DefaultServerWebsocketConfiguration` in `src/client/ServerConfiguration.ts`.
- If `pingCount` (pings sent without a reply) reaches `maxPingLostCount`, the client closes the socket itself with reason `MAXIMUM_PING_REACHED` — this shows up as a self-initiated close, not a server-side drop.

## HMAC Computation

If auth fails, verify manually — note the real parameter order is `(message, applicationKey, hmacKey)`, and the message signed is the challenge string, not an arbitrary payload:
```typescript
import { computeHmac } from "iink-ts"
const hash = await computeHmac(hmacChallengeString, applicationKey, hmacKey)
```

Contrast with HTTP clients (`HTTPClientV2`/`HTTPClientV1`): there, `computeHmac(JSON.stringify(requestBody), applicationKey, hmacKey)` is sent as an `hmac` **request header**, not exchanged via a challenge message.

## Reconnection Behavior

Two layers in `WebSocketClient.ts` — if strokes seem to vanish after a network blip, check these before assuming data loss:

1. **Offline queue**: if `configuration.server.websocket.offlineQueueEnabled` is true (default), calls made while disconnected are queued and replayed in order once reconnected, instead of failing immediately.
2. **Legacy auto-reconnect in `send()`**: if `autoReconnect` is true (default) and the socket is closing/closed, `send()` transparently reconnects and retries, up to `maxRetryCount` (default `2`).

Reconnect attempts for the offline-queue path run every `reconnectDelay` ms (default `3000`) up to `maxReconnectAttempts` (default `10`) before giving up and emitting a `CONNECTION_STATUS_CHANGED: "error"` event.

## Checking Connection State

There's no separate documented state-machine enum — check `canvas.client.socket.readyState` directly against the native `WebSocket` constants (`CONNECTING`, `OPEN`, `CLOSING`, `CLOSED`), and `canvas.client.initialized.promise` for whether the handshake completed.
