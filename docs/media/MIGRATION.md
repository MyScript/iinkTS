# Migration Guide

## v3.x → v4.0.0

Version 4.0.0 renames every class/type/constant that reused native MyScript SDK terms (`Editor`, `Recognizer`) for unrelated front-end concepts, source of long-standing confusion between the native SDK and iinkTS. This is a **breaking change** with no compatibility shim — the old names simply don't exist anymore. See [CHANGELOG.md](./CHANGELOG.md) for the full breaking-changes list; this guide gives step-by-step find/replace instructions for your integration code.

### 1. Entry point

```diff
- Editor.load(rootElement, "INTERACTIVEINK", options)
+ Canvas.load(rootElement, "INTERACTIVE_INK", options)
```

The type constants also changed format:

| v3.x | v4.0.0 |
|---|---|
| `"INTERACTIVEINK"` | `"INTERACTIVE_INK"` |
| `"INTERACTIVEINKSSR"` | `"INTERACTIVE_INK_SSR"` |
| `"INKV1"` | `"INK_V1"` |
| `"INKV2"` | `"INK_V2"` |

### 2. Class and type names

| v3.x | v4.0.0 |
|---|---|
| `InteractiveInkEditor` | `InteractiveInkCanvas` |
| `InteractiveInkSSREditor` | `InteractiveInkSSRCanvas` |
| `InkEditor` | `InkCanvas` |
| `InkEditorDeprecated` | `InkCanvasDeprecated` |

The matching `*Configuration`/`*Options` types follow the same rename (e.g. `InteractiveInkEditorConfiguration` → `InteractiveInkCanvasConfiguration`).

### 3. Network/client layer

| v3.x | v4.0.0 |
|---|---|
| `RecognizerHTTPV1` | `HTTPClientV1` |
| `RecognizerHTTPV2` | `HTTPClientV2` |
| `RecognizerWebSocket` | `WebSocketClient` |
| `RecognizerWebSocketSSR` | `WebSocketSSRClient` |
| `RecognizerHTTPV1Configuration` | `HTTPClientV1Configuration` |
| `RecognizerHTTPV2Configuration` | `HTTPClientV2Configuration` |
| `RecognizerWebSocketConfiguration` | `WebSocketClientConfiguration` |
| `RecognizerWebSocketSSRConfiguration` | `WebSocketSSRClientConfiguration` |
| `RecognizerWebSocketMessage` | `WebSocketClientMessage` |
| `RecognizerWebSocketSSRMessage` | `WebSocketSSRClientMessage` |
| `RecognizerEvent` | `ClientEvent` |
| `RecognizerError` | `ClientError` |

### 4. Public enums

| v3.x | v4.0.0 |
|---|---|
| `EditorTool` | `CanvasTool` |
| `EditorWriteTool` | `CanvasWriteTool` |
| `LoggerCategory.EDITOR` | `LoggerCategory.CANVAS` |
| `LoggerCategory.EDITOR_EVENT` | `LoggerCategory.CANVAS_EVENT` |

If you configure per-category log levels via `configuration.logger`, update the keys.

### 5. DOM-attached instance

If you retrieve the loaded instance directly off the DOM element instead of keeping the value returned by `Canvas.load()`:

```diff
- document.getElementById("myDiv").editor.export(["application/vnd.myscript.jiix"])
+ document.getElementById("myDiv").iink.export(["application/vnd.myscript.jiix"])
```

### 6. Custom CSS

If you have a stylesheet overriding iinkTS's default look:

| v3.x | v4.0.0 |
|---|---|
| `.ms-editor` (root class) | `.ms-ink` |
| `.editor-state`, `.editor-state-icon`, `.editor-state-count`, `.editor-state-tooltip`, `.editor-state-{state}` (connection badge) | `.ms-ink-state`, `.ms-ink-state-icon`, `.ms-ink-state-count`, `.ms-ink-state-tooltip`, `.ms-ink-state-{state}` |
| `--iink-*` custom properties (44 variables — `--iink-primary`, `--iink-surface`, `--iink-modal-*`, `--iink-spacing-*`, `--iink-radius-*`, etc.) | `--ms-ink-*` (e.g. `--iink-primary` → `--ms-ink-primary`) |
| `--iink-editor-bg` | `--ms-ink-canvas-bg` |

### 7. Examples directory

If you use the `examples/` folder as a reference, the layout was reorganized to match the new naming:

```
examples/rest/                    → examples/canvas/                 (rest_*.html → canvas_v1_*.html, rest_v2_*.html → canvas_v2_*.html)
examples/websocket/               → examples/interactive-canvas-ssr/ (websocket_*.html → interactive_canvas_ssr_*.html)
examples/offscreen-interactivity/ → examples/interactive-canvas/     (offscreen_interactivity_*.html → interactive_canvas_*.html)
                                   → examples/custom-rendering/tldraw-websocket-client/ (was offscreen_interactivity_tldraw/)
```

### What didn't change

- Recognition/configuration API (`recognition.text`, `recognition.math`, etc.)
- Runtime behavior — this is a pure rename, no logic changed

### Need help?

Open an issue on [GitHub](https://github.com/MyScript/iinkTS/issues) or check the [Developer website](https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/).
