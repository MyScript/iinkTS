# Perf gate — how a branch is measured

The gate answers one question: **does this branch cost more than the commit it left master at?**

It answers it by measuring both — the branch's `dist/` and a bundle built from the merge-base — on the
same agent, in the same job, alternating, and reading the ratio of the two. There is no committed
baseline and no reference figure to keep up to date.

## Why there is no baseline any more

The gate used to compare a run against `perf/headless/baseline.json`, a recording of one developer's
laptop on one day, while CI ran in Docker on shared agents. Two failures followed from that, and both
were measured rather than argued.

**The dispersion a baseline reports is not reproducible.** Recorded three times from unchanged code on
one quiet machine, every case's tail moved by a factor of two to five — `read: model.symbols` 17.9%,
17.7%, then 83.8%. Every threshold was derived from that tail, so every threshold was a lottery. The
median ratio, by contrast, reproduced to a few percent. A bound taken from a quantity that doubles
between recordings cannot bound anything.

**A baseline goes stale silently.** A case removed from the suite was reported as `case missing from
the current run, skipped` and the build stayed green. A baseline recorded before a case existed simply
never gated it.

### What the old baseline taught us, kept from the 2026-09-02 version

The figures before that date claimed to describe master and named a commit SHA. After E1 was rebased
that SHA was **no longer an ancestor of the branch**. That is why no version since names a SHA.

It also read as a **false regression**: the gate failed with four cases 16.7%–39.0% over their limits,
`derive` at +39%, none of it real — the source of every regressed case was unchanged. **Symptom to
recognise: a "regression" on a case whose source provably did not change.**

## How a run works

1. `yarn bench:ref` builds the reference bundle from `git merge-base origin/master HEAD`, in a
   detached worktree, into `dist-ref/`. On master itself the merge-base is HEAD, so `HEAD~1` is used —
   a build of master measures what its own last commit changed. Cached on the reference sha.
2. `yarn bench:ab` runs the whole suite eight times over each bundle, alternating, and writes the
   paired ratios.
3. `yarn bench:record` appends the run to the history, whether or not the gate will be happy.
4. `yarn bench:gate` gives the verdict.

Three choices in there are not free, and each was measured:

- **Eight rounds, not five.** Against byte-identical bundles — where every case must read exactly
  1.000 — the median paired ratio was still 42.8% out at five rounds and within 5.5% at eight.
- **ABBA order.** Plain alternation gives one build the earlier slot in every round, so any drift over
  the run lands on it as a systematic bias rather than as noise.
- **Both sides loaded the same way.** Loading the current build through the package's `#iink` and the
  reference through a `file://` URL resolves the same file by different mechanisms, and that asymmetry
  alone produced a **reproducible 23.5% false regression** on `read: getSymbol` — x0.767 then
  x0.764 across two independent runs of byte-identical bundles. Both sides now take an explicit path.

### The null test

Point the reference at a copy of the current bundle and run the gate: every case must read x1.000, and
whatever it reads instead is the method's own error. Four such runs put the worst case at 10.3%. That
is where the **20% floor** under the limit comes from — roughly a factor of two over the worst thing
observed on code that had not changed.

A null test is also how a case is shown to be unfit. `read: getSymbol` repeated one lookup 100 000
times and read 8.5%, 1.5% and then 29.4% out across three runs of identical code — an error with no
tendency to converge, which no threshold can be honest about. Rotating the lookup over every resident
id, which is both the realistic shape and a kinder one for the JIT, brought it to 2.2%, 3.8% and 8.1%.
**A case whose null error will not settle is a broken case, not a loose threshold.**

**Run a null test whenever the harness changes.** It is what caught the loading asymmetry above, and
nothing else would have: the gate was confidently, repeatably wrong, and every other signal looked
healthy.

```
cp dist/iink.esm.js dist-ref/iink.esm.js && yarn bench:ab && yarn bench:gate
```

## Where the limit comes from

The limit is not a constant. A branch changes the cost of a case or two; every other case measures the
same code on both sides and must read 1.000. How much those cases disagree with each other **is** the
run's own error, measured on this agent, in this job — so the run is asked how wrong it is, and the
limit is drawn from the answer:

```
limit = max(20%, 5 × the scatter of this run's gated cases)
```

Two details in there carry the whole design.

**The scatter is measured around the run's own centre, not around 1.000.** Measured from 1.000, a
change that slowed every case equally would push the scale up with it, the limit would widen to match,
and the gate would quietly excuse the one kind of regression it should be surest about. Measured
around the centre, a uniform slowdown leaves the scatter at zero, the limit falls to its floor, and
every case is flagged. There is a unit test that asserts exactly that.

**Past 10% scatter the run is refused, not widened.** At that point the limit the rule would produce
is 50%, which is not a gate. Measured null runs sit between 1.2% and 3.0%, so the ceiling is three to
eight times anything healthy.

The floor matters too: on a quiet run the scatter term lands around 6-11%, under the floor, so 20%
governs. The derived term is what stops a noisy agent from producing false regressions, not what sets
the everyday limit.

## What CI does with the verdict

The perf stages (`Bench gate`, `Browser perf`) only run when the Jenkins parameter `run_perf` is set; it
is off by default, so an ordinary branch or pull-request build measures nothing.

Three things can go wrong in the stage and they are not the same thing, so they no longer share a
message — a broken reference build used to read exactly like a regression.

| exit | meaning | build |
|---|---|---|
| 0 | no case moved past the limit | green |
| 1 | a case regressed | UNSTABLE |
| 2 | the gate refused to judge — too few rounds, or the run's own cases disagreed | UNSTABLE |
| — | the measurement could not be taken at all | UNSTABLE, and says nothing was measured |

**A regression does not currently stop a build.** Promoting it is one call in the `Jenkinsfile` —
`unstable` to `error` — and it is left alone deliberately: that is a team decision, not a technical
one. The technical part is settled, and it is the argument for promoting it: across four null runs the
gate's own error was at most 10.3% against a limit of 20%.

## Gotchas

- The bench needs a **production** build. A dev build (`yarn dev`) injects a livereload snippet whose
  first statement touches `self.document`, and the bench dies with `ReferenceError: self is not
  defined` — a message that names nothing useful. Run `yarn build:lib` first.
- `yarn typecheck` **excludes `perf/` entirely** (see `tsconfig.typecheck.json`): it imports `#iink`,
  which needs `dist/` built, and uses `.ts` import specifiers. A green `yarn typecheck` therefore says
  nothing about this tree — `yarn typecheck:perf` is what covers it, tests included.
- Cases are sized so one iteration lands in **0.1–10 ms**, with a repeat factor per case. Below about
  50 µs a case times the clock rather than the code, and the gate refuses to judge it. If a case gets
  fast enough to fall under that floor, raise its repeat factor; do not widen a threshold.
- **A CI checkout is not a clone, and the bench container has no git credentials.** A pull-request
  workspace holds the PR's own ref and nothing else — on PR-515 it held exactly one — so the base
  branch has to be put there by the `Checkout` stage, which adds it to the fetch refspec. That is
  where the fix lives, and it has to: fetching from inside the container fails with `Host key
  verification failed`.
  `yarn bench:ref` still tries, in order, the spellings of the base, the first parent of a pull
  request's merge commit (the target's tip, no network needed), a fetch, and then fails listing the
  refs the checkout does have. `BENCH_REF_BASE` names a different base; `BENCH_REF_SHA` or `--sha`
  skips the question entirely and never looks for the base at all.
- `yarn bench:e2e` runs in CI (stage `Browser perf`, with `run_perf`) but is **reported, never gated**. Like the gate,
  it needs `dist-ref/` from `yarn bench:ref` and refuses to start without it.
- The seed loop passes the *same* stroke objects to `addSymbol`, so since E5 those objects are frozen
  by the commit. Any case that iterates `strokes` is measuring frozen records. This is intentional —
  it is what the library hands out — but a case cannot be assumed to measure plain objects just
  because it never touches the model.

## Micro-benches — `yarn bench`

Seeded document, 500 strokes / 7876 pointers, seed 20260827. `of control` is the case divided by the
in-run control, kept for reading only — the gate does not use it. `paired` is the last null-test run,
where both bundles were identical and every figure should be x1.000.

`symbolGeometry:cold` sits an order of magnitude above the 0.1-10 ms band and stays there: one build
of the whole 4419-symbol set is its smallest indivisible unit, so there is no factor to lower. It
costs the suite about two seconds a process, which is the price of measuring the uncached path at the
size that made it worth measuring.

| case | ms | of control | samples | paired (null test) |
|---|---|---|---|---|
| `symbolGeometry:cold @4419` | 106.9384 | x1054.2 | 8 | x1.006 |
| `hit test: linear overlaps over all @500 x20` | 7.4427 | x73.4 | 8 | x0.972 |
| `transform: matrix over every pointer @500 x20` | 2.8869 | x28.5 | 8 | x0.972 |
| `read: getSymbol by id @500 x200` | 1.2970 | x12.8 | 8 | x0.915 |
| `import: build a model of 200 strokes x16` | 0.4497 | x4.4 | 8 | x0.999 |
| `read: model.symbols @500 x200` | 0.2553 | x2.5 | 8 | x0.969 |
| `symbolGeometry:warm @4419` | 0.2392 | x2.4 | 8 | x1.070 |
| `append: add then remove one stroke @500 x1000` | 0.2341 | x2.3 | 8 | x0.962 |
| `control: float arithmetic` | 0.1014 | x1.0 | 8 | x0.979 |

The paired column is the method's own error, not a property of the library: these two bundles were
byte-identical.

## Browser scenarios — `yarn bench:e2e`

Desktop Chrome and Tablet Safari (`PROJECT` narrows to one). Every scenario measures both builds in
the same browser, `PERF_E2E_ROUNDS` paired rounds (3 by default) in ABBA order: the reference is the
same example page with `dist/iink.esm.js` swapped for `dist-ref/iink.esm.js` by a route. The run
prints one table per project — scenario, metric, before, after, change, description — where before
and after are each build's median, and writes it to `PERF_E2E_REPORT_DIR/<project>.json`
(`.local/bench/perf-e2e/` by default). WebKit reports no long tasks, so Tablet Safari has no blocking
row: read its frame figures.

The tables below are single-build figures from before the A/B run, kept for the analysis under them.

Blocking time is the primary figure; wall clock includes the websocket round trip and
is reported only for context. There is no longer a document-size ceiling on these scenarios — see the
comment at the top of `perf/browser/scenarios.perf.ts` for why there was one and why it went.

Document of 150 strokes, the size the master baseline used:

| scenario | wall | blocking | longest task | frames p50 / p95 / max | dropped |
|---|---|---|---|---|---|
| import 150 strokes | 189 ms | 0 ms | 0 ms | 16.8 / 88.2 / 88.2 ms | 1 |
| write one stroke | 693 ms | 0 ms | 0 ms | 16.6 / 18.0 / 18.7 ms | 0 |
| pan, 90 frames | 1506 ms | 0 ms | 0 ms | 16.7 / 18.0 / 18.7 ms | 0 |
| zoom, 30 steps | 493 ms | 0 ms | 0 ms | 16.7 / 17.3 / 19.2 ms | 0 |
| **drag 150 selected symbols** | 569 ms | **0 ms** | 0 ms | 16.8 / 22.0 / 36.0 ms | 1 |
| erase across 150 strokes | 690 ms | 0 ms | 0 ms | 16.5 / 19.2 / 20.2 ms | 0 |
| lasso over 150 strokes | 712 ms | 0 ms | 0 ms | 16.6 / 18.8 / 20.8 ms | 0 |

Document of 4419 strokes, the reference size, which the harness can now reach:

| scenario | wall | blocking | longest task | frames p50 / p95 / max | dropped |
|---|---|---|---|---|---|
| import 4419 strokes | 5336 ms | 0 ms | 0 ms | 16.7 / 17.6 / **2434 ms** | 1 |
| write one stroke | 736 ms | 0 ms | 0 ms | 16.7 / 20.0 / 21.7 ms | 0 |
| pan, 90 frames | 1504 ms | 0 ms | 0 ms | 16.7 / 18.1 / 27.0 ms | 0 |
| zoom, 30 steps | 491 ms | 0 ms | 0 ms | 16.6 / 17.4 / 18.2 ms | 0 |
| **drag 4419 selected symbols** | 907 ms | **202 ms** | **202 ms** | 16.5 / 36.1 / **206 ms** | **3** |
| erase across 4419 strokes | 707 ms | 0 ms | 0 ms | 16.6 / 19.9 / 26.5 ms | 0 |
| lasso over 4419 strokes | 1019 ms | 0 ms | 0 ms | 17.0 / 30.6 / 41.4 ms | 1 |

**`blockingMs` does not see a long task raised inside an awaited `page.evaluate`.** The import row
reports 0 ms blocking next to a 2434 ms frame. Read `frameMaxMs` for anything driven from inside the
page, and `blockingMs` for anything driven through the pointer.

**Dragging a full selection was the one interaction that janked: 674–889 ms in a single long task at
4419 symbols, 0.2 ms per selected symbol.** Fixed by IIC-1984 — `SVGRenderer.drawSymbol` built an
element for every symbol and only then asked `#isInViewBox` whether to attach it, so committing the
transform rebuilt 4419 SVG paths to keep the **295** the viewport holds. An off-screen redraw of an
already-tracked symbol is now deferred to `#reconcileVirtualization`, which pays for it if and when
the symbol comes into view. **674–889 ms → 198–218 ms across three runs**, dropped frames 8–14 → 1–3,
and the import scenario's longest frame fell 2434 → 1461 ms for the same reason.

**What is left in that 202 ms is not rendering.** Counted per phase: the commit issues
`draftSymbol` × 4419, `drawSymbol` × 4419 and `commitSymbol` × 4419, and `SymbolStore.draft` alone
profiles at 138 ms — the clone-to-write E5 introduced. Reaching the 50 ms criterion would mean not
baking a rigid translate into every pointer at all, which is a different design, not a tuning pass.
Separately, each `pointermove` writes `transform` on **4420** elements (128 180 over a 30-move drag),
most of them detached: under the 50 ms long-task bar so it never shows in `blockingMs`, but it is what
the remaining dropped frames and the 31–36 ms p95 are made of.

IIC-1985 took the snap computation out of that per-move path. `IISnapManager` cached
`otherSnapPoints` behind a validity key built as `Array.from(selectedIds).sort().join(",")` — a
4419-entry array, a sort and a ~180 kB string **per pointermove**, so the check cost more than the
work it guarded — while `selectionSnapPoints` had no cache at all and listed the whole document each
time. Both now share one pass, keyed on `model.version` plus the new `model.selectionVersion`.
Everything under `snapTranslate` falls from ~171 ms to 44 ms over a 30-move drag, of which 34 ms is
`clearSnapToElementLines` querying the DOM rather than any snap arithmetic. End to end the drag's wall
clock goes **880–908 → 811–837 ms**; `blockingMs` does not move, because that number is the commit.
The per-move remainder is now browser layout/paint, the 4420 `transform` writes, and three
`model.symbolsSelected` reads per move that each list the whole store.


## Static counters

| counter | master baseline | now | which epic moves it |
|---|---|---|---|
| `.ts` files in `src/` | 308 | 322 | E3, E4 |
| lines in `src/` | 44 888 | 45 306 | — |
| linear scans over `model.symbols` | 66 | see note | E6 |
| `structuredClone` call sites | 13 in 7 files | **13 in 7 files** | E5 |
| spatial index | none | none | E6 |
| `dist/iink.min.js` | 632 345 B | 634 459 B | E9 (tree-shaking) |
| `dist/iink.esm.js` | 618 060 B | 620 243 B | E9 |
| runtime npm dependencies | 1 (`json-css`) | 1 (`json-css`) | E2 |

**The "66 linear scans" counter is not reproducible and should be replaced before E6 relies on it.**
The original 66 was recorded without its grep pattern, and the count swings wildly with the pattern
chosen: 46 for iteration methods on `.symbols` alone, 83 once `.symbolsSelected` is included, 211 for
every `.symbols` mention. Three plausible readings straddle the number the epic is supposed to drive
to zero. E6 needs to define what it counts — a committed script, not a remembered `grep` — before it
can claim to have moved it. Until then treat 66 as folklore.

The `structuredClone` count did not move, and the E5 acceptance criterion that asked for zero is
**not met**. What E5 removed was the clone on every *read* of the interactive document; the thirteen
remaining sites are elsewhere and mostly legitimate — `SymbolStore.draft` clones on purpose
(that is how a frozen record becomes writable), and the rest are in `Model`, `IModel` and
`symbol/legacy/Stroke`, which serve the non-interactive canvas variants. The criterion was written
against a counter, not against a behaviour, and the counter was the wrong instrument.


## Acceptance criteria this baseline creates, and where they stand

| criterion | epic | status |
|---|---|---|
| the micro-bench resident document reaches 4419 strokes without setup dominating | E5 | **unblocked, not done** — seeding 500 costs 15 ms, the cap can be lifted |
| `append` on a loaded document costs a frame or less | E5 | **met** — 0.00027 ms |
| `drag N selected symbols` shows no task above 50 ms | E5 | **met at 150** (0 ms), **still not met at 4419** — 674 → 202 ms via IIC-1984; the rest is the write contract, not the renderer |
| `structuredClone` call sites reach 0 | E5 | **not met** — 13 remain; see *Static counters* for why the counter was the wrong target |
| the 66 linear scans reach the "legitimate full walk" set only | E6 | **unmeasurable as written** — the counter is not reproducible, see *Static counters* |
| a document of 4419 strokes still holds 60 Hz on pan | E8 | **met** — p95 18.1 ms, 0 dropped frames at 4419 |
| an INK_V2-only bundle is materially smaller than 634 kB | E9 | not started |

## How to reproduce

```
yarn build:lib     # required: the bench needs a production dist
yarn bench:ref     # builds dist-ref/ from the merge-base, cached on its sha
yarn bench:ab      # 8 paired rounds over both bundles
yarn bench:gate    # the verdict; exits 1 on a regression, 2 when it refuses to judge
yarn bench:record  # appends the run to the history
yarn bench:history # the trend, oldest run on the left
yarn bench         # one single-sided run, the fast local read; not gateable
PERF_E2E_DOCUMENT=4419 PROJECT="Desktop Chrome" yarn bench:e2e   # browser scenarios
```

Verified on 2026-09-10 against the real gate: a uniform +30% across every case is caught on all eight
(the limit stays at its floor, which is the point) and exits 1; a single case at +40% is caught alone
and exits 1; a run whose cases scatter by 13% is refused with exit 2; three null runs pass with exit 0
at a 1.2-2.2% scatter.
