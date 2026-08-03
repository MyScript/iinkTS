---
name: write-unit-test
description: >
  Workflow for adding Jest unit tests to iinkTS. Use when creating tests for new
  or existing src/ files. Complements the `testing-patterns` skill (patterns reference).
  This skill covers the workflow; the `testing-patterns` skill covers the API reference.
---

# Write Unit Test

## Workflow

### 1. Find the mirror path

Test file = `test/unit/` + same path as `src/`:
```
src/manager/interactive/IIWriterManager.ts
→ test/unit/manager/interactive/IIWriterManager.test.ts
```

If the test file doesn't exist yet, create it. Never put tests elsewhere.

### 2. Load the patterns reference

Before writing, invoke the `testing-patterns` skill for:
- Mock setup (Canvas, WebSocket, fetch)
- Standard describe/it structure
- Available mocks: `createCanvasMock`/`asCanvas`, `InteractiveInkSSRCanvasMock`, `CanvasEventMock`, `ServerWebSocketMock`, etc.

### 3. Structure the test file

```typescript
import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import { ClassOrFunction } from "@/path/to/module"

describe("ClassName", () => {
  describe("methodName", () => {
    test("should [expected] when [condition]", () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### 4. Cover minimum cases per function

For every public function/method:
- ✅ Nominal — valid input, expected output
- ✅ Error — invalid/null/undefined input
- ✅ Edge — empty array, zero, boundary values
- ✅ Side effects — if the function mutates state or emits events

### 5. Coverage check

```bash
yarn test:unit --coverage --testPathPatterns="YourFile"
```

Target: ≥80% branches, functions, lines for new files.

Full suite check before commit:
```bash
yarn test:unit
```

## Quick Rules

- **No `any` in tests** — type your mocks explicitly
- **No implementation details** — test behavior, not internals
- **Isolate** — each test should pass independently (no shared mutable state between tests)
- **Mock at boundaries** — mock Canvas, WebSocket, fetch. Never mock the class under test itself.
- **One assertion focus per test** — multiple `expect` OK if they describe one behavior

## See Also

The `testing-patterns` skill — full mock API reference, WebSocket patterns, Playwright E2E patterns.
