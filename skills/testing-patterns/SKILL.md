---
name: testing-patterns
description: >
  Guide for writing and running tests in iinkTS. Use when adding unit tests with Jest,
  creating E2E tests with Playwright, or understanding mocking patterns for Canvas/WebSocket.
---

# Testing Patterns Skill

## Test Structure

### Unit Tests (Jest)

**Location**: `test/unit/` + the same path as in `src/` → `test/unit/{same/path}/{Class}.test.ts`

**Imports**: the library only through `@/iink` (lint rule `iink/barrel-imports`, which also catches missing exports); mocks, helpers and datasets by relative path.

**Example structure**:
```typescript
import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { ClassUnderTest } from '@/iink'

describe('ClassUnderTest', () => {
  let instance: ClassUnderTest
  
  beforeEach(() => {
    instance = new ClassUnderTest()
  })
  
  describe('methodName', () => {
    test('should do something when condition', () => {
      // Arrange
      const input = { ... }
      
      // Act
      const result = instance.methodName(input)
      
      // Assert
      expect(result).toEqual(expected)
    })
  })
})
```

### E2E Tests (Playwright)

**Location**: `test/examples/{canvas|interactive-canvas|interactive-canvas-ssr|custom-rendering}/{feature}.test.js` — mirrors the `examples/` subdirectory (not `.spec.ts`, real files are `.test.js`).

**Example structure** (trimmed from `test/examples/interactive-canvas/interactive-canvas-get-started.test.js`):
```javascript
import { test, expect } from "@playwright/test"
import { passModalKey, waitForUIUpdatedEvent } from "../helper"
import locator from "../locators"

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.PATH_PREFIX ?? ""}/examples/interactive-canvas/interactive_canvas_get_started.html`)
    await passModalKey(page)
  })

  test("should display the menu", async ({ page }) => {
    await expect(page.locator(locator.menu.action.guide.enable)).toBeHidden()
  })
})
```

Shared helpers in `test/examples/helper.js` (writing strokes, waiting for canvas events…) and selectors in `test/examples/locators.js`. Tags in test titles select subsets: `@minimal`, `@touch`, `@slow`. A purely vertical/horizontal SVG line fails `toBeVisible()` (zero-area box): use `toBeAttached()`.

## Mocking Patterns

### Canvas Mocking

Canvas is mocked via `jest-canvas-mock`:
```typescript
// Automatically loaded in jest.setup.ts
const ctx = canvas.getContext('2d')
expect(ctx.__getEvents()).toContainEqual({ type: 'moveTo', ... })
```

**Auto-loaded**: Configured in [test/unit/jest.config.js](test/unit/jest.config.js)

### WebSocket Mocking

**jest-websocket-mock** for unit tests:
```typescript
import WS from 'jest-websocket-mock'

test('should connect to websocket', async () => {
  const server = new WS('ws://localhost:1234')
  
  const client = new WebSocketClient(config)
  await client.init()
  
  await server.connected
  expect(server).toHaveReceivedMessages([...])
  
  server.close()
})
```

**Custom mocks** in [test/unit/__mocks__/](test/unit/__mocks__/):
- `ServerWebSocketMock` / `ServerWebSocketSSRMock` - Full WebSocket server simulation
- `WebSocketSSRClientMock` - subclass of `WebSocketSSRClient` for tests
- `EventMock` / `CanvasEventMock` - event class mocks

### Canvas Instance Mocking

Pre-built canvas mocks in [test/unit/__mocks__/](test/unit/__mocks__/):

```typescript
import { createCanvasMock, asCanvas } from '../../__mocks__/createCanvasMock'
import { InteractiveInkSSRCanvasMock } from '../../__mocks__/InteractiveInkSSRCanvasMock'
import { CanvasEventMock } from '../../__mocks__/CanvasEventMock'

// Usage — createCanvasMock is a factory (not a class), returns TCanvasMock
const mock = createCanvasMock({ /* overrides */ })
const canvas = asCanvas(mock) // cast to TInteractiveInkCanvas for code under test
const event = new CanvasEventMock()
```

### Fetch Mocking

Use `jest-fetch-mock`:
```typescript
import fetchMock from 'jest-fetch-mock'

beforeEach(() => {
  fetchMock.resetMocks()
})

test('should make API request', async () => {
  fetchMock.mockResponseOnce(JSON.stringify({ result: '...' }))
  
  const response = await client.send(strokes)
  
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/endpoint'),
    expect.objectContaining({ method: 'POST' })
  )
})
```

## Test Helpers & Utilities

**Location**: [test/unit/helpers.ts](test/unit/helpers.ts)

### Available Helper Functions

```typescript
import {
  delay,                    // Promise-based delay
  round,                    // Decimal rounding
  randomIntFromInterval,    // Random integer generation
  buildStroke,              // Legacy Stroke (INK_V1)
  buildStrokeV2,            // TStroke
  buildIIStroke,            // TStroke for the interactive variant
  buildIIEraser,            // TEraser
  buildIIDecorator, buildIICircle, buildIILine, buildIIText, buildIIMath,  // per-symbol-type builders
  expectPointsRounded,      // point arrays compared after rounding
  ellipseGeometry, edgeGeometry, decoratorGeometry, typesetGeometry,     // geometry shortcuts
} from '../helpers'          // path relative to the test file: test/unit/helpers.ts

// Example: Create test stroke — builders take one options object
const stroke = buildStrokeV2({
  box: { x: 0, y: 0, width: 100, height: 100 },
  nbPoint: 10,
  pointerType: 'pen',
})

// Example: Wait for async operations
await delay(100)  // Wait 100ms

// Example: Round numbers for assertions
expect(round(3.14159, 2)).toBe(3.14)
```

### Test Data Builders

**buildStrokeV2** - Create a `TStroke` with realistic data (from `test/unit/helpers.ts`):
```typescript
export function buildStrokeV2({
  box = defaultBox,
  style = DefaultPenStyle,
  nbPoint = 5,
  pointerType = "pen",
} = {}): TStroke {
  const stroke = StrokeUtil.createEmpty(style, pointerType)
  for (let i = 0; i < nbPoint; i++) {
    stroke.pointers.push({
      p: Math.random(),
      t: Date.now() + i,
      x: randomIntFromInterval(box.x, box.x + box.width),
      y: randomIntFromInterval(box.y, box.y + box.height),
    })
  }
  return stroke
}
```

**buildStroke** - Create a legacy `Stroke` (INK_V1), same options object:
```typescript
const stroke = buildStroke({ box: { x: 0, y: 0, width: 100, height: 100 }, nbPoint: 20 })
```

Builders default to `DefaultPenStyle`, 5 points and random coordinates inside the box — pass explicit values when the test asserts on them.

## Running Tests

### Unit Tests

```bash
# All unit tests
yarn test:unit

# Single file
yarn test:unit test/unit/canvas/InteractiveInkCanvas.test.ts

# Watch mode
yarn test:unit --watch

# Coverage
yarn test:unit:coverage
```

**Coverage threshold**: 88% branches/lines/statements, 86% functions, global (`test/unit/jest.config.js`). Jest only transpiles (`@swc/jest`): types are checked by `yarn typecheck`, tests included. Don't combine `--coverage` with `--detectOpenHandles` (very slow), and read success from the exit code, not from a piped summary.

### E2E Tests

```bash
# All examples
yarn test:examples

# Against a local backend, examples and browsers in docker (testcontainers), as CI does
yarn test:examples:docker

# One browser project (PROJECT: one name, or several separated by commas)
PROJECT="Desktop Chrome" yarn test:examples

# Specific file (path filter, no `--`) or test title
PROJECT="Desktop Chrome" yarn test:examples interactive-canvas-get-started
PROJECT="Desktop Chrome" yarn test:examples -g "Menu guide display"

# Only the @minimal tests
E2E_SCOPE=minimal yarn test:examples

# Headed / debug
PROJECT="Desktop Chrome" yarn test:examples --headed
PROJECT="Desktop Chrome" yarn test:examples --debug
```

`yarn test:examples -- <file>` does **not** filter: the `--` is passed through.

## Test Data

**Location**: `test/unit/__dataset__/` — real files:
- `configuration.dataset.ts` — sample client configs (`WebSocketSSRClientTextConfiguration`, `WebSocketSSRClientMathConfiguration`, `HTTPClientV1TextConfiguration`, ...)
- `exports.dataset.ts` — sample JIIX export payloads (`jiixText`, `jiixMathDuplicateStrokes`)
- `jiix.dataset.ts` — sample JIIX documents (`hTextJIIX`, `rectangleJIIX`, `circleJIIX`)

**Usage**:
```typescript
import { hTextJIIX } from '../__dataset__/jiix.dataset'
```

## Test Configuration

### Jest Config

Key settings in [test/unit/jest.config.js](test/unit/jest.config.js):
- `testEnvironment: "jsdom"` - Browser-like environment
- `transform` - `@swc/jest` for TS (transpile only), `jest-transform-css` for CSS, a custom SVG transform
- `moduleNameMapper` - `@/` alias to `src/`, web worker path resolution
- `setupFiles` - `jest-canvas-mock`, `__config__/jest.setup.ts`, TextEncoder polyfill, `setupTests.ts`
- `setupFilesAfterEnv` - `jest-websocket-mock`
- `coverageThreshold` - see above

### Playwright Config

Key settings in `test/examples/playwright.config.js`:
- Projects: `Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`, `Tablet Chrome`, `Tablet Safari`, `Whiteboard Chrome` (select with `PROJECT`)
- `E2E_SCOPE`: `default`, `minimal`, `complete`
- `globalSetup` starts the stack; `yarn test:examples:docker` runs backend, examples and browsers in Docker (testcontainers) like CI
- Base URL: `http://localhost:8000` (or `BASE_URL`), retries 1, timeout 60s
- Screenshot only on failure, video retained on failure

## Common Test Scenarios

### Testing Canvas Initialization

```typescript
test('should initialize canvas', async () => {
  const element = document.createElement('div')
  const canvas = await Canvas.load(element, 'INTERACTIVE_INK', options)
  
  await canvas.initializationPromise
  
  expect(canvas).toBeInstanceOf(InteractiveInkCanvas)
  expect(canvas.model).toBeDefined()
})
```

### Testing the Model

```typescript
import { IIModel } from '@/iink'
import { buildIIStroke } from '../helpers'

test('should add a symbol to the model', () => {
  const model = new IIModel()
  const stroke = buildIIStroke()

  model.addSymbol(stroke)

  expect(model.symbols).toHaveLength(1)
  expect(model.getSymbol(stroke.id)).toEqual(stroke)
})
```

Committed records are frozen: to test a change, `model.draftSymbol(id)` → mutate → `model.commitSymbol(draft)`.

### Testing a Manager

Build the canvas from `createCanvasMock` (override only what the test needs) and pass `asCanvas(mock)` to the manager — see existing specs under `test/unit/manager/interactive/`.

### Testing the WebSocket Client

Use `ServerWebSocketMock` (`test/unit/__mocks__/ServerWebSocketMock.ts`), which answers the handshake (`hmacChallenge` → `authenticated` → `sessionDescription` → `newPart`), then send server messages such as `{ type: "contentChanged", canUndo, canRedo, undoStackIndex }` and assert on the client's events. Real patterns: `test/unit/client/websocket/WebSocketClient.test.ts`.

## Testing Anti-Patterns

❌ **Don't** test implementation details (private methods)  
❌ **Don't** create brittle tests dependent on exact HTML structure  
❌ **Don't** forget to clean up (destroy editors, close WebSockets)  
❌ **Don't** use real network calls (always mock)  
❌ **Don't** share state between tests (use `beforeEach`)

## Debugging Tests

### Jest Debugging

```bash
# Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# VS Code: Add to launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Playwright Debugging

```bash
# Playwright Inspector
yarn test:examples -- --debug

# Headed with slow motion
yarn test:examples -- --headed --slow-mo=1000
```
