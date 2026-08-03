# iinkTS - AI Agent Instructions

**iinkTS**: TypeScript lib for handwriting recognition in web apps via MyScript Cloud API.

## Quick Reference

- **Build**: `yarn build:lib` or `npm run build:lib`
- **Test**: `yarn test:unit` (Jest), `yarn test:examples` (Playwright)
- **Dev**: `yarn dev` (starts Rollup watcher + example server on http://localhost:8000)
- **Lint**: `yarn lint` or `yarn lint:fix`
- **Docs**: `yarn build:docs` (TypeDoc)

## Agent Rules

No exceptions:

- **Use Serena for source code** — navigate/edit `src/`, `test/`, `examples/*.ts` via Serena tools (`find_symbol`, `find_referencing_symbols`, `get_symbols_overview`, `replace_symbol_body`, `insert_after_symbol`/`insert_before_symbol`) instead of raw `Read`/`Grep`/`Edit`. Native tools stay fine for config, Markdown, JSON, and non-code files.
- **Check `src/utils/` first** — before writing utility function, grep for existing equivalents. Duplication = bug.
- **Scope discipline** — fix bug, don't refactor adjacent code. Keep diffs minimal and reviewable.
- **Typecheck before commit** — always run `yarn typecheck` after code changes. Never run bare `tsc`, never use `--no-verify`.
- **No generated files** — never hand-edit `dist/`, `docs/`, or API report snapshots. Run owning generator command.
- **Public API changes need note** — any change to exported types/functions requires mention in PR description and CHANGELOG entry.
- **Prefer targeted checks** — run the narrowest relevant test/lint first (single file/suite). Avoid full `test:unit`/`test:examples` runs unless the change is cross-cutting.
- **Respect existing worktree changes** — don't revert or discard user changes unless explicitly asked.
- **No AI attribution** — never add Co-Authored-By or similar AI attribution in commits, PR descriptions, or docs.

## Architecture Overview

### Multi-Variant Canvas System

4 canvas variants via factory pattern:

| Canvas Type | Protocol | Recognition | Use Case |
|-------------|----------|-------------|----------|
| `INTERACTIVE_INK` | WebSocket | Real-time | Full-featured interactive editing |
| `INK_V2` | HTTP v2 | Batch | Simpler, stateless recognition |
| `INTERACTIVE_INK_SSR` | WebSocket SSR | Server-rendered | Server-side rendering |
| `INK_V1` | HTTP v1 | Batch | **DEPRECATED** - legacy only |

**Entry point**: `Canvas.load(element, "INTERACTIVE_INK", options)` in [src/canvas/Canvas.ts](src/canvas/Canvas.ts)

### Reference skills (invoke on demand — don't hold this in memory eagerly)

- **`iinkts-reference`** — directory map, naming conventions, symbol hierarchy, manager sub-systems, utility reference. Use for "where is X", "how is Y structured".
- **`canvas-drawing-patterns`** — manager lifecycle (destroy/cleanup), API design, canvas/geometry perf checklist. Use when adding/reviewing managers, renderer code, or hit-testing/geometry logic.
- **`typescript-strict-rules`** — TS type-safety checklist (no any, satisfies over as, discriminated unions). Use when writing/reviewing TypeScript.
- **`code-quality-principles`** — DRY, function size, mandatory tests checklist. Use before commit, during refactor/review.

## Skills

- Canonical agent skills live in `skills/` at repo root.
- `.claude/skills` is a symlink to `../skills` for Claude compatibility. Keep `skills/` as the source of truth.
- Skill folders use `skill-name/SKILL.md` with YAML frontmatter containing at least `name` and `description`.
- Do not duplicate skill content for different agents; add compatibility symlinks instead.

## Code Quality (Always Apply)

See the `code-quality-principles` skill for full detail.

- One source of truth per concept — use `src/utils/`, base classes
- DRY: 2 occurrences → extract function; 3 → abstraction
- Functions ≤ 20 lines, one abstraction level, explicit names
- Unit tests mandatory, mirror `src/` structure, ≥75% coverage

### TypeScript Rules (Hard)

- **No `any`** — never introduce `any`, explicit or implicit. No `as any`, no untyped params. Type boundary values explicitly with type guards or typed wrappers.
- **No type casts to silence errors** — fix the signature instead. Use `Partial<T>`, `Pick<T, K>`, generics. Use `satisfies` for object literal conformance, not `as T`.
- **Narrow optionality at source** — don't thread `T | undefined` through layers. Use `?.`/`??` with sensible defaults. Filter lists before iteration.

## Anti-Patterns (Avoid)

❌ Create managers directly → use canvas-provided instances
❌ Mutate model directly → use manager methods
❌ Mix symbol types between variants
❌ Forget to `await canvas.initializationPromise`
❌ Assume config properties exist → always merge with defaults
❌ Use `InkCanvasDeprecated` (INK_V1) for new code
❌ Hand-edit `dist/`, `docs/`, or API snapshots

## Documentation

- **API Docs**: `yarn build:docs` → `docs/`
- **External**: https://developer.myscript.com/docs/interactive-ink/latest/web/iinkts/

## Architecture Memory

Code/architecture notes (managers, symbol system, refactor status) live in Serena memory, not project files. Check via `mcp__serena__list_memories` / `read_memory` before assuming an area is undocumented.

## MyScript Cloud Integration

**Authentication**: HMAC-based (applicationKey + hmacKey) set in `configuration.server`.
See `examples/websocket/` for credential setup.
