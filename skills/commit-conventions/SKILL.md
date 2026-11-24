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
```

- **A commit written by an AI agent starts with `[ai] `** (lower-case, one space, before the type): `[ai] fix(grabber): capture the pointer IIC-2184`. Commitlint and `scripts/next-version.mjs` read the type after it
- Subject line only — the house style. Aim for **≤72 chars**, imperative mood ("add" not "added"), no period, ticket id at the end when there is one
- A body is accepted with a commitlint warning (`body-empty`), after a blank line, only when the why isn't obvious from the code
- `!` before the colon when the change breaks the public API
- Scopes are free (lower-case, several separated by a comma: `refactor(symbol-utils,manager): …`); the table below lists the usual ones
- Full rules and rejected/accepted examples: `CONTRIBUTING.md`
- Enforced by `commitlint.config.mjs`: `.husky/commit-msg` locally, `Commit messages` stage in the Jenkinsfile on branches and PRs (hard limit 120 chars, aim for 72)

## Types

| Type | When |
|------|------|
| `feat` | New user-visible functionality |
| `fix` | Bug fix |
| `perf` | Performance improvement (no behavior change) |
| `refactor` | Code restructuring (no behavior change, no bug fix) |
| `test` | Tests only |
| `docs` | Documentation only |
| `build` | Build system, packaging, dev stack (Rollup, Docker, testcontainers) |
| `ci` | Jenkinsfile, CI configuration |
| `style` | Formatting only |
| `revert` | Reverts a previous commit |
| `chore` | Deps, config, tooling, anything else |

The type sets the release bump: `!`/`BREAKING CHANGE:` → major, `feat` → minor, anything else → patch.

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
| `history` | HistoryManager variants |
| `grabber` | PointerEventGrabber |
| `style` | Style, PenStyle, Theme, StyleManager |
| `core` | `src/core/` primitives — geometry (incl. `Geometry2d`), math, std |
| `symbol-utils` | Per-type utils, registry, `SymbolGeometry`, `SVGBuilder` |
| `examples` | `examples/` directory |
| `deps` | Dependency updates |
| `release` | Release commits (`chore(release): …`, no bump) |

Omit scope only when change is truly cross-cutting (e.g., global TS config change).

## Examples

```
feat(canvas): add zoomToFit method to center view on content
fix(client): handle WebSocket reconnect after timeout
perf(renderer): use computeDistanceSquared in hot path
refactor(manager): extract IIAbstractTransformManager base class
test(symbol): add type guard tests for TStroke variants
build: replace the Makefile with a testcontainers stack
ci: always build lib and gate perf stages on run_perf only
docs(examples): add interactive_canvas_math_variables example
chore(deps): upgrade rollup to 4.x
[ai] fix(grabber): keep a gesture's pointer events on the canvas IIC-2184
```

## Rules

- Never `--no-verify`
- Every commit message an AI agent writes or proposes starts with `[ai] `
- Never amend a published commit
- Never include AI attribution ("Co-authored-by: Claude")
- One logical change per commit — split if unrelated changes crept in
- Hooks: `pre-commit` runs `lint-staged` (eslint --fix on staged files), `commit-msg` runs commitlint, `pre-push` runs `yarn typecheck`. If one fails: fix the issue, then commit again
