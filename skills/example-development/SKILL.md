---
name: example-development
description: >
  Guide for creating, modifying, and debugging example pages. Use when adding new examples,
  fixing example issues, or understanding how to integrate iinkTS in different scenarios.
---

# Example Development Guide

## Example Structure

All examples follow a consistent pattern in `examples/` directory.

### Directory Organization

```
examples/
├── index.html                 # Example gallery/landing page
├── assets/                    # Shared assets
│   ├── img/                   # Icons, gestures/ subfolder, logos
│   ├── style/                 # Shared CSS (reset, components, examples, inputs, panel)
│   └── js/                    # theme.js (dark/light toggle)
├── components/
│   ├── modal/                 # modalCanvasOptions.js — ModalCanvasOptions class + modal.css
│   └── code-viewer/            # code-viewer.js — inline source viewer widget
├── interactive-canvas/        # WebSocket (InteractiveInkCanvas) examples — 19 files
├── interactive-canvas-ssr/    # WebSocket SSR (InteractiveInkSSRCanvas) examples — 28 files
├── canvas/                    # HTTP (InkCanvas v2, InkCanvasDeprecated v1) examples — 16 files
├── non-specific/              # Configuration demos — 2 files
├── custom-rendering/          # Third-party integrations (tldraw-websocket-client/)
└── dev/                       # Development utilities (the only example still using the UMD build)
```

Matching E2E specs live in `test/examples/{same-subdir}/*.test.js` (real extension is `.test.js`, not `.spec.ts`).

### Example Categories

**Interactive Canvas Examples** (`interactive-canvas/` — 19 files, pattern `interactive_canvas_{feature}.html`)

Real-time recognition using WebSocket protocol (`InteractiveInkCanvas`): `interactive_canvas_get_started.html`, `_connection_status`, `_create_symbols`, `_default_options`, `_gestures`, `_keyboard_shortcuts`, `_live_monitor`, `_math_computation_modes`, `_math_context_menu`, `_math_dependencies`, `_math_variables`, `_menu_config`, `_minimap`, `_override_menu`, `_selection`, `_showcase`, `_stroke_playback`, `_style`, `_zoom_pan`.

**Interactive Canvas SSR Examples** (`interactive-canvas-ssr/` — 28 files)

Server-side-rendered WebSocket variant (`InteractiveInkSSRCanvas`).

**Canvas (HTTP) Examples** (`canvas/` — 16 files)

Batch recognition using HTTP API:
- **v2 (current, `InkCanvas`)**: `canvas_v2_text.html`, `_math`, `_shape`, `_raw_content`, `_text_vertical_japanese`, `_multi_canvas_exam`, `_multi_canvas_grading`
- **v1 (deprecated, `InkCanvasDeprecated`)**: `canvas_v1_text.html`, `_math`, `_diagram`, `_diagram_import`, `_text_styling`, `_raw_content`, `_no_ui`, `_custom_client`, `_custom_grabber`

**Non-Specific Examples** (`non-specific/` — 2 files)

`change_configuration.html`, `professionalSupport.html`.

**Custom Rendering** (`custom-rendering/`)

`tldraw-websocket-client/index.html` — third-party integration with the tldraw canvas library.

## Example Template

Both templates below are trimmed from real, current examples — verify against the source files if you need the full version.

### Basic Interactive Canvas (WebSocket) Example

Trimmed from `examples/interactive-canvas/interactive_canvas_get_started.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Get Started</title>
  <link rel="stylesheet" href="../assets/style/reset.css" />
  <link rel="stylesheet" href="../assets/style/components.css" />
  <link rel="stylesheet" href="../assets/style/examples.css" />
</head>
<body>
  <header class="header-main">
    <button id="showModalBtn" class="btn-keys">API Keys</button>
    <h1 class="header-title">Interactive Ink Canvas - Get Started</h1>
  </header>

  <div id="rootEl"></div>

  <script type="module">
    import { Canvas } from "../../dist/iink.esm.js"
    import { ModalCanvasOptions } from "../components/modal/modalCanvasOptions.js"

    const rootElement = document.getElementById("rootEl")
    const showModalBtn = document.getElementById("showModalBtn")

    let canvas

    const canvasOptions = {
      configuration: {},
    }

    async function loadCanvas(options) {
      canvas = await Canvas.load(rootElement, "INTERACTIVE_INK", options)
    }

    showModalBtn.addEventListener("click", () => {
      ModalCanvasOptions.show(loadCanvas, canvasOptions)
    })

    ModalCanvasOptions.initConfiguration(loadCanvas, canvasOptions)
  </script>
</body>
</html>
```

The full `InteractiveInkCanvas` variant ships its own built-in toolbar (write/erase/select/undo/redo/convert/export) — most examples don't hand-wire nav buttons at all; they only add extra UI for the feature being demonstrated.

### Basic Canvas (HTTP) Example

Trimmed from `examples/canvas/canvas_v2_text.html` — the ESM build is used here too (the UMD `iink.min.js` build is only used by `examples/dev/index.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Ink Canvas v2 Text</title>
  <link rel="stylesheet" href="../assets/style/reset.css" />
  <link rel="stylesheet" href="../assets/style/components.css" />
  <link rel="stylesheet" href="../assets/style/examples.css" />
</head>
<body>
  <header class="header-main">
    <button id="showModalBtn" class="btn-keys">API Keys</button>
    <h1 class="header-title">Ink Canvas v2 Text</h1>
  </header>

  <div id="result"></div>

  <nav class="flex-container wrap gap between">
    <div class="flex-container wrap gap">
      <button id="clear" class="nav-btn btn-fab-mini btn-lightBlue" disabled><img src="../assets/img/clear.svg" /></button>
      <button id="undo" class="nav-btn btn-fab-mini btn-lightBlue" disabled><img src="../assets/img/undo.svg" /></button>
      <button id="redo" class="nav-btn btn-fab-mini btn-lightBlue" disabled><img src="../assets/img/redo.svg" /></button>
    </div>
    <select id="language"></select>
  </nav>

  <div id="rootEl"></div>

  <script type="module">
    import { getAvailableLanguageList, Canvas } from "../../dist/iink.esm.js"
    import { ModalCanvasOptions } from "../components/modal/modalCanvasOptions.js"

    const rootElement = document.getElementById("rootEl")
    const resultElement = document.getElementById("result")
    const clearElement = document.getElementById("clear")
    const undoElement = document.getElementById("undo")
    const redoElement = document.getElementById("redo")
    const showModalBtn = document.getElementById("showModalBtn")

    let canvas

    clearElement.addEventListener("click", () => canvas?.clear())
    undoElement.addEventListener("click", () => canvas?.undo())
    redoElement.addEventListener("click", () => canvas?.redo())

    const canvasOptions = {
      configuration: {
        recognition: {
          type: "TEXT",
          lang: "en_US",
          text: { mimeTypes: ["text/plain"] },
        },
      },
    }

    async function loadCanvas(options) {
      resultElement.innerHTML = ""
      await canvas?.destroy()

      canvas = await Canvas.load(rootElement, "INK_V2", options)

      canvas.event.addEventListener("changed", (event) => {
        undoElement.disabled = !event.detail.canUndo
        redoElement.disabled = !event.detail.canRedo
        clearElement.disabled = !event.detail.canClear
      })

      canvas.event.addEventListener("exported", (event) => {
        resultElement.innerHTML = event.detail?.["text/plain"] || ""
      })
    }

    showModalBtn.addEventListener("click", () => ModalCanvasOptions.show(loadCanvas, canvasOptions))
    ModalCanvasOptions.initConfiguration(loadCanvas, canvasOptions)
  </script>
</body>
</html>
```

Note `canUndo`/`canRedo`/`canClear` arrive on the `changed` event's `detail`, not as direct properties read at arbitrary times — there's no public `canvas.canUndo` getter to poll.

## Common Patterns

### Loading Canvas with Different Types

Real `TCanvasType` values (`src/canvas/AbstractCanvas.ts`):

```javascript
// WebSocket — full features
await Canvas.load(element, "INTERACTIVE_INK", options)

// WebSocket SSR — server-side rendering
await Canvas.load(element, "INTERACTIVE_INK_SSR", options)

// HTTP v2 — current, stateless batch
await Canvas.load(element, "INK_V2", options)

// HTTP v1 — deprecated
await Canvas.load(element, "INK_V1", options)
```

### Configuration Modal Integration

```javascript
import { ModalCanvasOptions } from '../components/modal/modalCanvasOptions.js'

ModalCanvasOptions.show(loadCanvas, canvasOptions)             // open on demand (e.g. button click)
ModalCanvasOptions.initConfiguration(loadCanvas, canvasOptions) // wire initial load + config restore
```

The modal allows runtime configuration changes (server URL, API keys). Real class name is `ModalCanvasOptions`, file `examples/components/modal/modalCanvasOptions.js`.

### Export Handling

```javascript
canvas.event.addEventListener('exported', (event) => {
  const exports = event.detail

  const text = exports['text/plain']
  const jiix = exports['application/vnd.myscript.jiix']
  const latex = exports['application/x-latex']  // math

  document.getElementById('result').innerHTML = text || ''
})
```

Or the typed wrapper: `canvas.event.addExportedListener((exports) => { ... })`.

### Import Content

There is no generic `import(jiix, mimeType)` on `InteractiveInkCanvas`/`InkCanvas`. Real options:
- `canvas.importPointEvents(strokes: TPartialDeep<TStroke>[])` — replays raw point/stroke data (see `examples/canvas/canvas_v1_diagram_import.html`).
- `InteractiveInkSSRCanvas.import(data: Blob | string | TJIIXExport, mimeType?: string)` — JIIX/content import, unique to the SSR variant.

### Custom Styling

```javascript
const canvasOptions = {
  configuration: {
    recognition: { /* ... */ },
  },
  penStyle: {
    color: '#2E7D32',
    width: 2,
    '-myscript-pen-width': 2,
    '-myscript-pen-fill-style': 'none',
    '-myscript-pen-fill-color': '#FFFFFF00',
  },
}
```

See `examples/canvas/canvas_v1_text_styling.html` for a full example. `canvas.penStyle = { ... }` can also be set after load to restyle at runtime.

### Tool Switching

```javascript
import { CanvasTool } from '../../dist/iink.esm.js'  // enum defined in src/Constants.ts

canvas.tool = CanvasTool.Erase
canvas.tool = CanvasTool.Write
```

### Gesture Handling

Gestures are automatic on `InteractiveInkCanvas` (WebSocket) — no manual wiring needed to detect them; the built-in toolbar/canvas handles recognition. Gesture reference images live in `examples/assets/img/gestures/`.

### Custom Resources

```javascript
const canvasOptions = {
  configuration: {
    recognition: {
      type: 'MATH',
      math: {
        customGrammarContent: '<grammar>...</grammar>',
        customResources: ['customSymbol1', 'customSymbol2'],
      },
    },
  },
}
```

## Development Workflow

### 1. Create New Example

```bash
# Copy an existing template in the matching category
cp examples/interactive-canvas/interactive_canvas_get_started.html examples/interactive-canvas/interactive_canvas_my_feature.html

# Edit HTML — update title, add feature-specific code

# Test locally
yarn dev
# Open http://localhost:8000/examples/interactive-canvas/interactive_canvas_my_feature.html
```

### 2. Add to Example Index

Edit `examples/index.html` and add a card linking to the new page (see existing cards for the expected markup).

### 3. Test Example

```bash
# Manual testing
yarn dev

# E2E testing — add a spec under the matching test/examples/{category}/ dir
yarn test:examples -- interactive-canvas-my-feature.test.js
```

## Debugging Examples

### Browser DevTools

1. Open example in browser
2. Open DevTools (F12)
3. Check Console for errors
4. Network tab for WebSocket/HTTP traffic
5. Sources tab for debugging (sources under webpack://)

### Common Issues

**Issue**: Canvas not loading
**Cause**: Invalid configuration, missing credentials
**Fix**: Check console errors, verify server config

**Issue**: No recognition results
**Cause**: WebSocket not connected, invalid strokes
**Fix**: Check Network tab for WebSocket connection, verify stroke data

**Issue**: Import fails
**Cause**: Invalid JIIX format, unsupported MIME type
**Fix**: Validate JIIX structure, check MIME type

**Issue**: Styling not applied
**Cause**: CSS specificity, incorrect property names
**Fix**: Use browser inspector, check MyScript pen-style properties

### Logging

Real logger config is **per-category**, not a single global level string (`src/logger/LoggerConfiguration.ts`), and levels are the numeric `LoggerLevel` enum (`DEBUG`/`INFO`/`WARN`/`ERROR` — there is no `TRACE`):

```javascript
import { LoggerCategory, LoggerLevel } from '../../dist/iink.esm.js'

const canvasOptions = {
  configuration: {
    logger: {
      [LoggerCategory.CANVAS]: LoggerLevel.DEBUG,
      [LoggerCategory.CLIENT]: LoggerLevel.DEBUG,
    },
  },
}
```

## Shared Components

### ModalCanvasOptions

Reusable modal for changing server configuration at runtime.

**Location**: `examples/components/modal/modalCanvasOptions.js`

**Usage**:
```javascript
import { ModalCanvasOptions } from '../components/modal/modalCanvasOptions.js'

ModalCanvasOptions.show(loadCanvas, canvasOptions)
ModalCanvasOptions.initConfiguration(loadCanvas, canvasOptions)
```

### code-viewer

`examples/components/code-viewer/` — inline source-code viewer widget used on several example pages (`code-viewer.js` + `code-viewer.css`).

### Shared Styles

`examples/assets/style/`: `reset.css`, `components.css`, `examples.css`, `inputs.css`, `panel.css`.

## Mobile Considerations

Most examples include mobile viewport settings:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="HandheldFriendly" content="true" />
```

Test on actual devices or Chrome DevTools device emulation.

## Best Practices

✅ **Do** follow an existing example in the same category as a template
✅ **Do** use shared styles and components
✅ **Do** handle canvas events via `canvas.event.addEventListener(...)` or the typed `addXListener` wrappers
✅ **Do** disable nav buttons until enabled by the `changed` event's `canUndo`/`canRedo`/`canClear`
✅ **Do** `await canvas?.destroy()` before creating a new one
✅ **Do** add meaningful titles and descriptions

❌ **Don't** hardcode credentials (use `ModalCanvasOptions` for testing)
❌ **Don't** forget mobile viewport meta tags
❌ **Don't** invent methods not present on the target canvas variant (e.g. generic `import()` on `InteractiveInkCanvas`)
❌ **Don't** create duplicate functionality (reuse `components/`)
❌ **Don't** commit API keys to repository
