---
name: commit-conventions
description: >
  Conventional Commits format with iinkTS-specific scopes. Use when writing commit messages,
  reviewing commit quality, or setting up commit tooling. Covers types, scopes, examples, and rules.
---

# Commit Conventions

## Format

```
type(scope): brief description

Optional body explaining WHY (not what) if complex.
```

- Subject line: **≤72 chars**, imperative mood ("add" not "added"), no period
- Body: only when the why isn't obvious from the code

## Types

| Type | When |
|------|------|
| `feat` | New user-visible functionality |
| `fix` | Bug fix |
| `perf` | Performance improvement (no behavior change) |
| `refactor` | Code restructuring (no behavior change, no bug fix) |
| `test` | Tests only |
| `docs` | Documentation only |
| `chore` | Build, deps, config, tooling |

## Scopes (iinkTS-specific)

| Scope | Covers |
|-------|--------|
| `canvas` | Canvas variants, `CanvasFactory`, `CanvasEvent` |
| `client` | `HTTPClientV1/V2`, `WebSocketClient`, `WebSocketSSRClient` |
| `renderer` | SVGRenderer, CanvasRenderer, helpers |
| `manager` | Any `*Manager` class |
| `symbol` | TSymbol hierarchy, type guards, SymbolFactory |
| `model` | Model, IModel, IIModel |
| `menu` | Menu system, actions, context menus, tools |
| `transform` | Matrix transformation utilities |
| `history` | HistoryManager variants |
| `grabber` | PointerEventGrabber |
| `style` | Style, PenStyle, Theme, StyleManager |
| `utils` | `src/utils/` functions |
| `examples` | `examples/` directory |
| `build` | Rollup config, build pipeline |
| `deps` | Dependency updates |

Omit scope only when change is truly cross-cutting (e.g., global TS config change).

## Examples

```
feat(canvas): add zoomToFit method to center view on content
fix(client): handle WebSocket reconnect after timeout
perf(renderer): use computeDistanceSquared in hot path
refactor(manager): extract AbstractTransformManager base class
test(symbol): add type guard tests for IIStroke variants
docs(examples): add interactive_canvas_math_variables example
chore(deps): upgrade rollup to 4.x
```

## Rules

- Never `--no-verify`
- Never amend a published commit
- Never include AI attribution ("Co-authored-by: Claude")
- One logical change per commit — split if unrelated changes crept in
- If lint/typecheck hook fails: fix the issue, then new commit
