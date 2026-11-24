import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { test, type BrowserContext, type Page } from "@playwright/test"

import { generateDocument } from "../headless/lib/generateDocument.ts"
import { referenceFirst } from "../headless/lib/paired.ts"
// The shared e2e helpers are plain JavaScript; `allowJs` lets them resolve, `checkJs` keeps them out
// of this project's type checking.
import { passModalKey } from "../../test/examples/helper.js"
import type { TScenarioSides } from "./lib/abReport.ts"
import { installProbe, longTasksSupported, measure, type TScenarioMeasurement } from "./lib/instrument.ts"
import { mergeReport, runId } from "./lib/reportFile.ts"

/**
 * The four perf targets of the v5 roadmap (decision D-6), measured in a real browser rather than in
 * jsdom. Reported, never gated: browser numbers are too noisy to fail a pull request on. They exist
 * to confirm that a micro-bench win is felt where the user is.
 *
 * Like the micro-benches, every scenario measures two builds side by side, in the same browser,
 * minutes apart: the reference bundle `yarn bench:ref` builds from the commit the branch left its
 * base at, and the current `dist/`. A figure held against a run made on another day would compare
 * two machines as much as two builds.
 */
const PAGE = "/examples/interactive-canvas/interactive_canvas_get_started.html"

/** Document loaded before the interaction scenarios. Small on purpose — see the report notes. */
const DOCUMENT_SIZE = Number(process.env.PERF_E2E_DOCUMENT || 150)

/** Fixed seed, shared with the node micro-benches, so both measure the same geometry. */
const SEED = 20260827

/**
 * There is no size ceiling on the pointer-driven scenarios, and the reason is worth keeping.
 *
 * They used to skip above 1000 strokes: importing more ended with a "connection to the recognition
 * server" error whose modal backdrop swallowed every subsequent gesture, so a drag reported a clean
 * measurement of nothing. That was never a defect of its own — it was a symptom of the quadratic
 * import this branch removes. While a 3000-stroke import blocked the main thread for ~133 s, the
 * WebSocket keepalive starved and the session dropped. Re-measured after the fix: 1000, 2000, 3000
 * and 4419 all import cleanly and every scenario asserts a real effect, so the ceiling now only
 * hides the sizes worth measuring.
 *
 * What guards these scenarios is the effect assertion at the end of each one, not a stroke count. If
 * a modal ever swallows a gesture again it fails loudly and `describePoint` names what was hit.
 */

/** Paired rounds per scenario: each measures the reference and the current build once. */
const ROUNDS = Number(process.env.PERF_E2E_ROUNDS || 3)

const REFERENCE_LIB = resolve(process.cwd(), "dist-ref/iink.esm.js")
const REFERENCE_SHA = resolve(process.cwd(), "dist-ref/.reference-sha")

type TBuild = keyof TScenarioSides

/** One or more named figures, measured on a page that already shows the example. */
type TScenario = (page: Page) => Promise<Record<string, TScenarioMeasurement>>

const results: Record<string, TScenarioSides> = {}
/** Runs of the reference build that crashed the page, so the report can say why a cell is empty. */
const referenceCrashes: string[] = []
let longTasks = false

type TCanvasWindow = {
  rootEl: {
    iink: {
      importPointEvents(strokes: unknown[]): Promise<unknown>
      pan(dx: number, dy: number): void
      zoom(z: number): void
      selectAll(): void
      unselectAll(): void
      tool: string
      model: { symbols: { id: string }[]; symbolsSelected: { id: string }[] }
    }
  }
}

/** The generated document in the shape `importPointEvents` accepts. */
function documentStrokes(count: number): unknown[] {
  return generateDocument(count, SEED).map((s) => ({ pointerType: s.pointerType, pointers: s.pointers }))
}

/**
 * What the browser thinks is under a viewport point, and how the canvas is laid out there. Used only
 * to explain a scenario that touched nothing: a gesture can land on an overlay, or on a detached
 * region, and the failure message has to say which.
 */
async function describePoint(page: Page, x: number, y: number): Promise<string> {
  return await page.evaluate(
    ({ px, py }) => {
      const el = document.elementFromPoint(px, py)
      const describe = (n: Element | null) =>
        n
          ? `${n.tagName.toLowerCase()}${n.id ? "#" + n.id : ""}${n.classList.length ? "." + [...n.classList].join(".") : ""}`
          : "none"
      const modal = document.querySelector(".ms-modal")
      const rendering = document.querySelector(".ms-rendering") ?? document.querySelector("svg")
      const r = rendering?.getBoundingClientRect()
      return [
        modal ? `MODAL OPEN: ${(modal.textContent ?? "").trim().slice(0, 160)}` : "no modal",
        `point (${Math.round(px)},${Math.round(py)}) -> ${describe(el)}`,
        `parent ${describe(el?.parentElement ?? null)}`,
        `rendering rect ${r ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` : "none"}`,
        `viewport ${window.innerWidth}x${window.innerHeight}`,
      ].join(" | ")
    },
    { px: x, py: y }
  )
}

/**
 * Viewport rect of the first rendered symbol that is actually on screen. Derived by measurement
 * rather than from `generateDocument`'s page layout: at 3000 strokes the content is ~6360px tall, the
 * canvas element outgrows the viewport, and offsets computed from the element's box stop landing on
 * ink. The SVG renderer also virtualizes, so an off-screen symbol has no element at all.
 */
async function firstVisibleSymbolRect(page: Page): Promise<{ id: string; x: number; y: number; w: number; h: number }> {
  const rect = await page.evaluate(() => {
    const canvas = (window as unknown as TCanvasWindow).rootEl.iink
    for (const symbol of canvas.model.symbols) {
      const el = document.getElementById(symbol.id)
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (r.width > 2 && r.height > 2 && r.top > 0 && r.bottom < window.innerHeight) {
        return { id: symbol.id, x: r.x, y: r.y, w: r.width, h: r.height }
      }
    }
    return null
  })
  if (!rect) throw new Error("no rendered symbol is visible in the viewport")
  return rect
}

async function importDocument(page: Page): Promise<void> {
  const strokes = documentStrokes(DOCUMENT_SIZE)
  await page.evaluate(
    async (payload) => await (window as unknown as TCanvasWindow).rootEl.iink.importPointEvents(payload),
    strokes
  )
}

/**
 * A fresh page on the example, running either build. The page imports `../../dist/iink.esm.js`; the
 * reference is that same page with the bundle swapped under it, so nothing but the library differs.
 */
async function openExample(context: BrowserContext, build: TBuild): Promise<Page> {
  const page = await context.newPage()
  await installProbe(page)
  // Every run shares the test's context, so the server settings the first run saved would skip the
  // modal `passModalKey` fills on the next one, and it would wait for it forever.
  await page.addInitScript(() => window.localStorage.removeItem("server"))
  if (build === "reference") {
    await page.route("**/dist/iink.esm.js", (route) =>
      route.fulfill({ path: REFERENCE_LIB, contentType: "text/javascript; charset=utf-8" })
    )
  }
  await page.goto(PAGE)
  await passModalKey(page)
  return page
}

/** Runs the scenario on both builds, round after round, swapping which goes first (ABBA). */
async function measureBoth(context: BrowserContext, scenario: TScenario): Promise<void> {
  for (let round = 0; round < ROUNDS; round++) {
    const order: TBuild[] = referenceFirst(round) ? ["reference", "current"] : ["current", "reference"]
    for (const build of order) {
      const page = await openExample(context, build)
      longTasks = await longTasksSupported(page)
      const measured = await unlessCrashed(page, scenario)
      await page.close()
      if (!measured) {
        // The reference is the base branch's code: a crash there is a bug this branch may have fixed,
        // so it leaves its cells empty instead of failing the run. In the current build it is news.
        if (build === "current") throw new Error(`the current build crashed the browser page (round ${round + 1})`)
        referenceCrashes.push(`${test.info().title}, round ${round + 1}`)
        continue
      }
      for (const [name, measurement] of Object.entries(measured)) {
        results[name] ??= { reference: [], current: [] }
        results[name][build].push(measurement)
      }
    }
  }
}

/**
 * Runs the scenario, or gives up as soon as the page's process crashes. A crashed page never answers
 * again, so without this every pending command waits out the test timeout — 15 minutes per run.
 */
async function unlessCrashed(
  page: Page,
  scenario: TScenario
): Promise<Record<string, TScenarioMeasurement> | undefined> {
  let onCrash = (): void => {}
  const crashed = new Promise<undefined>((resolve) => {
    onCrash = () => resolve(undefined)
    page.once("crash", onCrash)
  })
  const measuring = scenario(page)
  // Once the page is gone the scenario's pending commands reject; nobody is waiting for them anymore.
  measuring.catch(() => {})
  try {
    return await Promise.race([measuring, crashed])
  } finally {
    page.off("crash", onCrash)
  }
}

// One report per project, in `PERF_E2E_REPORT_DIR`: CI points it at the directory it carries forward
// from build to build, beside the micro-bench history. `abReporter.ts` prints it at the end.
function saveReport(project: string): void {
  mergeReport({
    run: runId(),
    generatedAt: new Date().toISOString(),
    project,
    documentSize: DOCUMENT_SIZE,
    rounds: ROUNDS,
    ...(existsSync(REFERENCE_SHA) ? { referenceSha: readFileSync(REFERENCE_SHA, "utf8").trim() } : {}),
    longTasks,
    results,
    referenceCrashes,
  })
}

test.describe("browser perf scenarios", () => {
  // The config's timeout is for one run; every scenario here runs twice per round.
  test.describe.configure({ timeout: ROUNDS * 2 * 150 * 1000 })

  test.beforeAll(() => {
    if (!existsSync(REFERENCE_LIB)) {
      throw new Error("no reference bundle at dist-ref/iink.esm.js — run yarn bench:ref first.")
    }
  })

  test.afterAll(async ({ browserName }, testInfo) => {
    saveReport(`${testInfo.project.name} (${browserName})`)
  })

  test("import a document", async ({ context }) => {
    await measureBoth(context, async (page) => ({
      [`import ${DOCUMENT_SIZE} strokes`]: await measure(page, async () => await importDocument(page)),
    }))
  })

  test("write a stroke on a loaded document", async ({ context }) => {
    await measureBoth(context, async (page) => {
      await importDocument(page)
      await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "write"))

      // A real pointer stroke, not an API call: this is the write-latency path the user feels. The
      // start point is anchored on ink that is provably on screen, because an offset taken from the
      // canvas element's own box lands past the viewport as soon as the document outgrows it, and a
      // stroke drawn off screen reports a clean measurement of nothing.
      const before = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
      const ink = await firstVisibleSymbolRect(page)
      const startX = Math.max(1, ink.x)
      const startY = Math.max(20, ink.y - 14)

      const measured = await measure(page, async () => {
        await page.mouse.move(startX, startY)
        await page.mouse.down()
        for (let i = 1; i <= 40; i++) {
          await page.mouse.move(startX + i * 4, startY + Math.sin(i / 4) * 12)
        }
        await page.mouse.up()
      })

      const after = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
      if (after <= before) {
        const where = await describePoint(page, startX, startY)
        throw new Error(
          `the pointer stroke created no symbol (${before} -> ${after}). ` +
            `start ${Math.round(startX)},${Math.round(startY)} | ${where}`
        )
      }
      return { "write one stroke": measured }
    })
  })

  test("pan and zoom across a loaded document", async ({ context }) => {
    await measureBoth(context, async (page) => {
      await importDocument(page)

      const pan = await measure(page, async () => {
        // Driven one step per animation frame, so the measured frame intervals are the library's
        // response to a viewport change rather than Playwright's command round trip.
        await page.evaluate(async () => {
          const canvas = (window as unknown as TCanvasWindow).rootEl.iink
          for (let i = 0; i < 90; i++) {
            await new Promise((r) => requestAnimationFrame(() => r(undefined)))
            canvas.pan(i % 2 === 0 ? -6 : 6, i % 3 === 0 ? -4 : 2)
          }
        })
      })

      const zoom = await measure(page, async () => {
        await page.evaluate(async () => {
          const canvas = (window as unknown as TCanvasWindow).rootEl.iink
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => requestAnimationFrame(() => r(undefined)))
            canvas.zoom(i % 2 === 0 ? 1.05 : 0.95)
          }
        })
      })
      return { "pan 90 frames": pan, "zoom 30 steps": zoom }
    })
  })

  test("drag a full selection", async ({ context }) => {
    await measureBoth(context, async (page) => {
      await importDocument(page)
      await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.selectAll())

      // Grabbed on ink that is provably on screen: the centre of the canvas element is past the
      // viewport once the document outgrows it, and a pointerdown there drags nothing while still
      // reporting a plausible number.
      const ink = await firstVisibleSymbolRect(page)
      const grabX = ink.x + ink.w / 2
      const grabY = ink.y + ink.h / 2

      const measured = await measure(page, async () => {
        await page.mouse.move(grabX, grabY)
        await page.mouse.down()
        for (let i = 1; i <= 30; i++) {
          await page.mouse.move(grabX + i * 3, grabY + i * 2)
        }
        await page.mouse.up()
      })

      const moved = await page.evaluate((id) => {
        const el = document.getElementById(id)
        if (!el) return null
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y }
      }, ink.id)
      if (!moved || (Math.abs(moved.x - ink.x) < 2 && Math.abs(moved.y - ink.y) < 2)) {
        const where = await describePoint(page, grabX, grabY)
        throw new Error(
          `the drag moved nothing: symbol ${ink.id} stayed at ` +
            `${moved ? `${Math.round(moved.x)},${Math.round(moved.y)}` : "no element"} ` +
            `(was ${Math.round(ink.x)},${Math.round(ink.y)}) | ${where}`
        )
      }
      return { [`drag ${DOCUMENT_SIZE} selected symbols`]: measured }
    })
  })

  test("erase across a loaded document", async ({ context }) => {
    await measureBoth(context, async (page) => {
      await importDocument(page)
      const before = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
      await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "erase"))

      // An erase drag through empty space would report a clean zero while measuring nothing, so the
      // path is anchored on a symbol that is provably on screen and the assertion below is part of the
      // scenario rather than a nicety.
      const ink = await firstVisibleSymbolRect(page)

      const measured = await measure(page, async () => {
        await page.mouse.move(ink.x, ink.y + ink.h / 2)
        await page.mouse.down()
        for (let i = 1; i <= 40; i++) {
          await page.mouse.move(ink.x + i * 14, ink.y + ink.h / 2 + (i % 6) * 8)
        }
        await page.mouse.up()
      })

      const after = await page.evaluate(() => (window as unknown as TCanvasWindow).rootEl.iink.model.symbols.length)
      if (after >= before) {
        const where = await describePoint(page, ink.x, ink.y + ink.h / 2)
        throw new Error(
          `the erase drag removed nothing (${before} -> ${after}). ` +
            `ink rect ${Math.round(ink.x)},${Math.round(ink.y)} ${Math.round(ink.w)}x${Math.round(ink.h)} | ${where}`
        )
      }
      return { [`erase across ${DOCUMENT_SIZE} strokes`]: measured }
    })
  })

  test("lasso-select across a loaded document", async ({ context }) => {
    await measureBoth(context, async (page) => {
      await importDocument(page)
      await page.evaluate(() => ((window as unknown as TCanvasWindow).rootEl.iink.tool = "select"))

      // Growing the selection rectangle is what costs: the manager re-evaluates which symbols the box
      // covers on every pointermove. This is the path `drag a full selection` never touches, because
      // that one starts from selectAll().
      const ink = await firstVisibleSymbolRect(page)
      // Starts just above and left of the ink, on empty canvas: generateDocument leaves the space
      // between baselines sparse. A pointerdown on ink would begin a symbol drag instead of a
      // selection rectangle.
      const startX = Math.max(1, ink.x - 12)
      const startY = Math.max(1, ink.y - 12)

      const measured = await measure(page, async () => {
        await page.mouse.move(startX, startY)
        await page.mouse.down()
        for (let i = 1; i <= 40; i++) {
          await page.mouse.move(startX + i * 18, startY + i * 9)
        }
        await page.mouse.up()
      })

      const selected = await page.evaluate(
        () => (window as unknown as TCanvasWindow).rootEl.iink.model.symbolsSelected.length
      )
      if (selected === 0) {
        const where = await describePoint(page, startX, startY)
        throw new Error(
          `the lasso selected nothing. ` +
            `ink rect ${Math.round(ink.x)},${Math.round(ink.y)} ${Math.round(ink.w)}x${Math.round(ink.h)} | ${where}`
        )
      }
      return { [`lasso over ${DOCUMENT_SIZE} strokes`]: measured }
    })
  })
})
