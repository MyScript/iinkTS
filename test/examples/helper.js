import { expect } from "@playwright/test"

/**
 * @param {Page} page - Playwright Page
 * @param {Array}  pointers
 * @param {Object} pointers[0]
 * @param {Number} pointers[0].x
 * @param {Number} pointers[0].y
 * @param {Number} pointers[0].t
 * @param {Number} pointers[0].p
 * @param {Number} [offsetTop=0]
 * @param {Number} [offsetLeft=0]
 */
export const writePointers = async (
  page,
  pointers,
  offsetTop = 0,
  offsetLeft = 0
) => {
  const rootEl = page.locator("#rootEl")
  const editorExist = (await rootEl.count()) != 0
  let offsetX = 0
  let offsetY = 0
  if (editorExist) {
    const boundingBox = await rootEl.evaluate((node) =>
      node.getBoundingClientRect()
    )
    offsetX = offsetLeft + boundingBox.x
    offsetY = offsetTop + boundingBox.y
  }
  const firstPointer = pointers[0]
  let oldTimestamp = 0
  if (firstPointer.t) {
    oldTimestamp = firstPointer.t
  }
  const browserName = page.context().browser()?.browserType().name()
  await page.mouse.move(offsetX + firstPointer.x, offsetY + firstPointer.y)
  await page.mouse.down()
  for (const p of pointers) {
    let waitTime = 20
    if (oldTimestamp > 0) {
      waitTime = p.t - oldTimestamp
      oldTimestamp = p.t
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(waitTime)
    await page.mouse.move(offsetX + p.x, offsetY + p.y)
  }
  await page.mouse.up()
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(100)
}

/**
 * @param {Page} page - Playwright Page
 * @param {Array} strokes
 * @param {Object} strokes[0]
 * @param {Array} strokes[0].pointers
 * @param {Object} strokes[0].pointers[0]
 * @param {Number} strokes[0].pointers[0].x
 * @param {Number} strokes[0].pointers[0].y
 * @param {Number} strokes[0].pointers[0].t
 * @param {Number} strokes[0].pointers[0].p
 * @param {Number} [offsetTop=0]
 * @param {Number} [offsetLeft=0]
 */
export const writeStrokes = async (
  page,
  strokes,
  offsetTop = 0,
  offsetLeft = 0
) => {
  for (const s of strokes) {
    await writePointers(page, s.pointers, offsetTop, offsetLeft)
  }
}

/**
 * 
 * @param {Array} strokes
 * @param {Object} strokes[0]
 * @param {Array} strokes[0].pointers
 * @param {Object} strokes[0].pointers[0]
 * @param {Number} strokes[0].pointers[0].x
 * @param {Number} strokes[0].pointers[0].y
 * @param {Number} [padding=6] 
 * @returns 
 */
export const boundsOf = (strokes, padding = 6) => {
  const points = strokes.flatMap((s) => s.pointers)
  return {
    minX: Math.min(...points.map((p) => p.x)) - padding,
    maxX: Math.max(...points.map((p) => p.x)) + padding,
    minY: Math.min(...points.map((p) => p.y)) - padding,
    maxY: Math.max(...points.map((p) => p.y)) + padding,
  }
}

/**
 * 
 * @param {Object} bounds
 * @param {Number} bounds.minX
 * @param {Number} bounds.minY
 * @param {Number} bounds.maxX
 * @param {Number} bounds.maxY
 * @param {Number} [rows=6] 
 * @returns 
 */
export const buildEraseSweepPointers = (bounds, rows = 6) => {
  const { minX, maxX, minY, maxY } = bounds
  const pointers = []
  let t = 0
  for (let i = 0; i < rows; i++) {
    const y = Math.round(minY + ((maxY - minY) * i) / (rows - 1))
    const xs = i % 2 === 0 ? [minX, maxX] : [maxX, minX]
    for (const x of xs) {
      pointers.push({ x, y, t: (t += 40), p: 0.5 })
    }
  }
  return pointers
}

/**
 *
 * @param {Page} page - Playwright Page
 * @param {string|object} expectedResult
 * @param {string} exportType ['text/plain', 'application/x-latex', 'application/x-mathml']
 * @param {number} [nbRetry=5]
 * @returns
 */
export const getExportedResults = async (
  page,
  expectedResult,
  exportType,
  nbRetry = 5
) => {
  return new Promise(async (resolve, reject) => {
    let exported = null
    for (let i = 0; i < nbRetry; i++) {
      exported = await getEditorExportsType(page, exportType)
      if (exported) {
        switch (exportType) {
          case "text/plain":
          case "application/x-latex":
          case "application/x-mathml":
            if (exported === expectedResult) {
              return resolve(exported)
            }
            break
        }
      }
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(500)
    }
    return reject(`Exported ${exportType} not found`)
  })
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Object>
 */
export const getEditorConfiguration = async (page) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate("rootEl.iink.configuration")
}

/**
 * @param {Page} page - Playwright Page
 * @param {Object} options - Canvas options
 * @returns Promise<void>
 */
export const loadEditor = async (page, options) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate(
    `(async () => await loadEditor(${JSON.stringify(options)}))()`
  )
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorExports = async (page) =>
  page.evaluate("rootEl.iink.model.exports")
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorExportsType = async (page, type) =>
  page.evaluate(`rootEl.iink.model?.exports?.['${type}']`)

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorConverts = async (page) =>
  page.evaluate("rootEl.iink.model.converts")
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorSymbols = async (page) =>
  page.evaluate("rootEl.iink.model.symbols")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExportV2>
 */
export const getEditorStrokes = async (page) =>
  page.evaluate("rootEl.iink.model.strokes")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const callEditorExport = async (page, type) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  const exports = await page.evaluate(`rootEl.iink.export(['${type}'])`)
  return exports[type]
}
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const callEditorSynchronize = async (page) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate(`rootEl.iink.synchronize()`)
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const callEditorIdle = async (page) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate("rootEl.iink.waitForIdle()")
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const callEditorConvert = async (page) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate("rootEl.iink.convert()")
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const callEditoClear = async (page) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate("rootEl.iink.clear()")
}

/**
 * Rejects with a clear error if the event never fires within `timeout`, instead of hanging
 * page.evaluate indefinitely (page.evaluate has no timeout of its own — this used to only
 * surface as a confusing "Test timeout of 60000ms exceeded" deep inside page.evaluate, seen
 * flaky on CI). 30s default leaves generous room for a real content-change round trip while
 * still failing well before the outer test timeout.
 * @param {Page} page - Playwright Page
 * @param {string} eventName
 * @param {number} [timeout=30000]
 * @returns Promise<unknow>
 */
export const waitForEvent = async (page, eventName, timeout = 30000) => {
  await page.waitForFunction(() => !!document.querySelector('#rootEl')?.iink);
  return page.evaluate(`(async () => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Event "${eventName}" did not fire within ${timeout}ms'));
      }, ${timeout});
      document.querySelector('#rootEl').iink.event.addEventListener('${eventName}', (e) => {
        clearTimeout(timer);
        resolve(e.detail);
      }, { once: true });
    });
  })()`);
};

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const waitForExportedEvent = async (page) =>
  await waitForEvent(page, "exported")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const waitForImportedEvent = async (page) =>
  waitForEvent(page, "imported")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForChangedEvent = async (page, timeout) => waitForEvent(page, "changed", timeout)

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
export const waitForConvertedEvent = async (page) =>
  waitForEvent(page, "converted")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForLoadedEvent = async (page) => waitForEvent(page, "loaded")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForUIUpdatedEvent = async (page) =>
  waitForEvent(page, "ui-updated")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForSessionOpenedEvent = async (page) =>
  waitForEvent(page, "session-opened")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForSynchronizedEvent = async (page) =>
  waitForEvent(page, "synchronized")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForToolChangedEvent = async (page) =>
  waitForEvent(page, "tool-changed")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForSelectedEvent = async (page) =>
  waitForEvent(page, "selected")

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForGesturedEvent = async (page) =>
  waitForEvent(page, "gestured")

export const waitForEditorInit = async (page) => {
  await page.waitForFunction(() => !!rootEl?.iink)
  return page.evaluate("rootEl.iink.initializationPromise")
}

export const findValuesByKey = (obj, key, list = []) => {
  if (!obj) return list
  if (obj instanceof Array) {
    Object.keys(obj).forEach((k) => {
      list = list.concat(findValuesByKey(obj[k], key, []))
    })
    return list
  }
  if (obj[key]) {
    if (obj[key] instanceof Array) {
      Object.keys(obj[key]).forEach((l) => {
        list.push(obj[key][l])
      })
    } else {
      list.push(obj[key])
    }
  }

  if (typeof obj === "object") {
    const children = Object.keys(obj)
    if (children.length > 0) {
      children.forEach((child) => {
        list = list.concat(findValuesByKey(obj[child], key, []))
      })
    }
  }
  return list
}

// Shared by the offscreen math-* test files (computation-modes, context-menu, dependencies,
// variables) — a single math block's DOM id for its rendered ghost-mode result strokes.
export const GHOST_STROKE_SELECTOR = '[id^="ghost-stroke-"]'

// Waiting for a single "exported"/"synchronized" event is unreliable for multi-stroke writes:
// recognition can push intermediate updates while writing, so the first event doesn't
// guarantee the JIIX for the finished expression is ready. Poll the actual condition instead.
// Returns the jiix export that satisfied the poll, instead of making callers re-fetch it
// separately right after — model.exports is a live snapshot, and a second fetch a moment
// later can race with an in-flight recompute and come back undefined (seen on CI:
// "TypeError: Cannot read properties of undefined (reading 'elements')").
export const pollJiix = async (page, minCount, timeout = 8000) => {
  let jiix
  await expect
    .poll(async () => {
      jiix = await getEditorExportsType(page, "application/vnd.myscript.jiix")
      return jiix?.elements?.length ?? 0
    }, { timeout })
    .toBeGreaterThanOrEqual(minCount)
  return jiix
}

// Match by substring, not strict equality: cloud recognition of longer/more complex
// expressions can vary slightly run to run (spacing, glyph choice, ...) even when shorter ones
// are stable. Takes the already-fetched jiix (see pollJiix) rather than re-fetching it.
export const getBlockIdByLabel = async (page, jiix, label) => {
  for (const element of jiix.elements) {
    const blockLabel = await page.evaluate((id) => rootEl.iink.jiix.getBlockLabel(id), element.id)
    if (blockLabel?.includes(label)) {
      return element.id
    }
  }
  return undefined
}

// Opens ≡ → Math (the main action menu's math submenu) — e.g. for "Edit Variables" (global)
// or "Show Math Capabilities Overview", neither of which need a block selected first.
export const openMathActionMenu = async (page) => {
  await page.locator("#ms-menu-action").click()
  await page.locator("#ms-menu-action-math-trigger").click()
}

// Opens the *per-block* context menu's math submenu — the wrapper only shows once a symbol is
// selected (see IISelectionManager calling canvas.menu.context.show()).
export const openMathContextMenu = async (page) => {
  await expect(page.locator("#ms-menu-context-wrapper")).toBeVisible()
  await page.locator("#ms-menu-context-math-trigger").click()
}

// Select a block by its known jiixBlockId instead of drawing a surround gesture — useful for
// reselecting after a modal interaction (canvas.select() doesn't itself call
// menu.context.show(), so call both) or whenever the target block's id is already known:
// it's a more robust default than a surround gesture, real or synthetic. Drawing a *second*
// real gesture in the same test is flaky (waitForGesturedEvent has no timeout of its own and
// hangs the whole test if the second gesture never fires a "gestured" event).
export const selectBlockById = async (page, jiixBlockId) => {
  const symbols = await getEditorSymbols(page)
  const ids = symbols.filter((s) => s.jiixBlockId === jiixBlockId).map((s) => s.id)
  await page.evaluate((ids) => {
    rootEl.iink.select(ids)
    rootEl.iink.menu.context.show()
  }, ids)
  await expect
    .poll(() => page.evaluate(() => rootEl.iink.model.symbolsSelected.length), { timeout: 3000 })
    .toBeGreaterThan(0)
}

// No recorded surround-gesture capture exists for most math_context_menu.* datasets (only
// "sum" has a hand-captured surroundPointers). Selection only needs the gesture stroke to be
// classified as SURROUND by the cloud client and to geometrically contain the expression's
// bounds (see SurroundGestureHandler#apply: OBBOps.contains(gestureStroke.bounds, s.bounds)) —
// so a synthetic padded ellipse around the written strokes' bounding box is sufficient.
// `steps` defaults lower on WebKit: drawing this ellipse over already-rendered ink reproducibly
// crashes WebKit's renderer ("Target crashed") — fewer intermediate points means fewer SVG
// re-renders during the gesture. Doesn't fully eliminate the crash (pre-existing, undiagnosed
// WebKit rendering issue), but reduces how often it happens. Pass `steps` explicitly from a
// test's `browserName` fixture, e.g. `buildSurroundPointers(strokes, { steps: browserName ===
// "webkit" ? 12 : 32 })`.
export const buildSurroundPointers = (strokes, { padding = 40, steps = 32 } = {}) => {
  const points = strokes.flatMap((s) => s.pointers)
  const minX = Math.min(...points.map((p) => p.x)) - padding
  const maxX = Math.max(...points.map((p) => p.x)) + padding
  const minY = Math.min(...points.map((p) => p.y)) - padding
  const maxY = Math.max(...points.map((p) => p.y)) + padding
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rx = (maxX - minX) / 2
  const ry = (maxY - minY) / 2
  const t0 = Date.now()
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2
    return {
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle)),
      t: t0 + i * 15,
      p: 0.6,
    }
  })
}

// Selection in this editor happens via a recognized "surround" gesture (closed loop drawn with
// the write tool) — the math context menu is shown automatically once a single math block is
// selected. Asserts exactly 1 *distinct Math block* among the selected symbols, not just
// symbolsSelected.length: a multi-stroke expression like "√5=" legitimately selects several raw
// symbols (one per stroke), so a raw length check wouldn't catch the real failure mode — if the
// gesture (real or synthetic) ever also catches a stray adjacent artifact,
// IIMenuContext#hasSingleMathSymbol (which counts distinct blocks, same check as here) goes
// false, and the whole math submenu stays hidden. Left uncaught, that only surfaces later as a
// confusing "button stayed hidden until timeout" failure instead of a clear "selection picked
// up N blocks" one here.
export const selectBlockViaSurround = async (page, surroundPointers) => {
  await Promise.all([
    waitForGesturedEvent(page),
    writePointers(page, surroundPointers),
  ])
  await expect
    .poll(() => page.evaluate(() => {
      const selected = rootEl.iink.model.symbolsSelected
      return rootEl.iink.jiix.getBlocksForSymbols(selected).filter((s) => s.type === "Math").length
    }), { timeout: 3000 })
    .toBe(1)
}

export const passModalKey = async (page, waitLoader = true) => {
  // The "online-working"/"syncing" connection-state badge pulses via infinite CSS
  // animations. On WebKit, a running animation keeps stalling the automation
  // protocol's command acks, so page.mouse.move() gets ~10x slower for the whole
  // duration the badge stays active (e.g. undo-redo "session" mode, where it
  // doesn't go back to idle between strokes). The `reducedMotion` Playwright
  // context option doesn't reliably reach WebKit, so force it via emulateMedia.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByLabel('Scheme:httpshttp').selectOption(process.env.SCHEME)
  await page.getByRole('textbox', { name: 'Host:' }).fill(process.env.HOST)
  await page.getByRole('textbox', { name: 'Application Key:' }).fill(process.env.APPLICATION_KEY)
  await page.getByRole('textbox', { name: 'HMAC Key:' }).fill(process.env.HMAC_KEY)
  await page.getByRole('button', { name: 'Save' }).click()
  if (waitLoader) {
    await page.locator('.loader').waitFor({ state: 'hidden' })
    await waitForEditorInit(page)
  }
}
