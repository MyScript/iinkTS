---
name: code-quality-principles
description: iinkTS code quality checklist — centralization, DRY, short functions, mandatory tests. Invoke before commit, during refactor, code review, or when creating a new file.
---

# Code Quality Principles

## Centralization

One source of truth per concept. `src/utils/` for cross-cutting utilities, `Abstract*`/`Base*` classes for shared behavior. Before writing a utility function → grep `src/utils/` first.

## DRY

- 2 occurrences of the same logic → extract a function
- 3 occurrences of the same pattern → extract an abstraction
- Magic constant → extract (`const NORMALIZATION_FACTOR = 1000`)

## Short functions

- Max 20 lines (ideal 10)
- One abstraction level per function
- Early return for failure cases
- Naming: `is*/has*/can*` (boolean), `get*/find*` (value), `set*/update*` (mutation)

```typescript
// bad: mixes validation + normalization + transformation + rendering + side-effect
function processAndRenderStroke(stroke, canvas, options) { /* 30+ lines, 4 levels */ }

// good: each function one level
function isValidStroke(stroke) { return !!stroke?.pointerType && stroke.x.length > 0 }
function normalizeStroke(stroke) { return { ...stroke, x: normalizeArray(stroke.x) } }
function processStroke(stroke) { return isValidStroke(stroke) ? normalizeStroke(stroke) : null }
```

## Unit tests (mandatory)

- Mirror architecture: `test/unit/` mirrors `src/`
- Coverage ≥75% (branches/functions/lines/statements)
- Naming `{ClassName}.test.ts`
- Minimum per function: nominal case, error case, edge case (null/undefined/empty/zero)

## Refactoring patterns

- **Extract function**: repeated condition → named function (`isValidData`)
- **Extract constant**: magic number → named const
- **Replace conditional with polymorphism**: `if/else if` on a type → interface + implementations

## Checklist before commit

- [ ] No duplication
- [ ] Functions ≤20 lines, one abstraction level
- [ ] Explicit names (no comment needed)
- [ ] Early returns for failure cases
- [ ] Unit tests present, `yarn test:unit --coverage` ≥75%
- [ ] `yarn typecheck` clean
