---
name: testing-patterns
description: >
  Guide for writing and running tests in iinkTS. Use when adding unit tests with Jest,
  creating E2E tests with Playwright, or understanding mocking patterns for Canvas/WebSocket.
---

# Testing Patterns Skill

## Test Structure

### Unit Tests (Jest)

**Location**: `test/unit/{module}/{Class}.test.ts`

**Example structure**:
```typescript
import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { ClassUnderTest } from '@/module/ClassUnderTest'

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

**Example structure**:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should load and initialize canvas', async ({ page }) => {
    await page.goto('/examples/interactive-canvas/interactive_canvas_get_started.html')
    await page.waitForSelector('#rootEl')
    
    const canvasEl = page.locator('#rootEl')
    await expect(canvasEl).toBeVisible()
  })
})
```

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
  buildStroke,              // Create basic Stroke test data
  buildStrokeV2,            // Create TStroke test data
  buildIIStroke,            // Create IIStroke (TSymbol) test data
  buildIIEraser,            // Create eraser test data
  buildIIDecorator, buildIICircle, buildIILine, buildIIText, buildIIMath  // per-symbol-type builders
} from '../helpers'

// Example: Create test stroke
const stroke = buildStrokeV2(
  { x: 0, y: 0, width: 100, height: 100 },  // bounds
  10,                                        // point count
  'pen'                                      // pointer type
)

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
  const stroke = StrokeOps.create(style, pointerType)
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

**buildStroke** - Create basic Stroke for simple tests:
```typescript
const stroke = buildStroke(
  { x: 0, y: 0, width: 100, height: 100 },
  20  // 20 points
)
```

### Test Configuration

**Default test values** used in helpers:
- `DefaultPenStyle` - Standard pen styling
- `DefaultStyle` - Base symbol styling
- Default DPI: 96
- Default pointer pressure: 0.5

## Running Tests

### Unit Tests

```bash
# All unit tests
yarn test:unit

# Single file
yarn test:unit -- test/unit/canvas/InteractiveInkCanvas.test.ts

# Watch mode
yarn test:unit -- --watch

# Coverage
yarn test:unit -- --coverage
```

**Coverage threshold**: 75% for branches, functions, lines, statements (enforced in CI).

### E2E Tests

```bash
# All examples
yarn test:examples

# Specific test
yarn test:examples -- interactive-canvas-get-started.test.js

# Headed mode (see browser)
yarn test:examples -- --headed

# Debug mode
yarn test:examples -- --debug
```

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
- `preset: "ts-jest"` - TypeScript support
- `moduleNameMapper` - Web worker path resolution
- `setupFiles` - Canvas mock, TextEncoder polyfill
- `transform` - CSS and SVG transforms

### Playwright Config

Key settings in `test/examples/playwright.config.js`:
- Browser targets: Chromium, Firefox, WebKit
- Base URL: `http://localhost:8000`
- Screenshot on failure
- Video recording

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

### Testing Stroke Drawing

```typescript
test('should add stroke to model', () => {
  const stroke: Stroke = {
    id: 'stroke-1',
    pointerType: 'pen',
    pointsX: [0, 10, 20],
    pointsY: [0, 10, 20],
    pointsT: [0, 100, 200],
    pointsP: [0.5, 0.5, 0.5],
    style: { color: '#000000' }
  }
  
  model.addStroke(stroke)
  
  expect(model.symbols).toHaveLength(1)
  expect(model.symbols[0]).toEqual(stroke)
})
```

### Testing Recognition

```typescript
test('should recognize strokes', async () => {
  const server = new WS('ws://localhost:1234')
  const client = new WebSocketClient(config)
  const onContentChanged = jest.fn()
  client.event.addContentChangedListener(onContentChanged)

  await client.init()
  await server.connected

  await client.addStrokes([stroke])

  // Mock recognition response
  server.send(JSON.stringify({
    type: 'contentChanged',
    exports: { 'text/plain': 'Hello' }
  }))

  expect(onContentChanged).toHaveBeenCalled()
})
```

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
