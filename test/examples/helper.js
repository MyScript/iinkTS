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
export const writePointers = async (page, pointers, offsetTop = 0, offsetLeft = 0) => {
  const editorEl = page.locator("#editor");
  const editorExist = await editorEl.count() != 0;
  let offsetX = 0;
  let offsetY = 0;
  if(editorExist) {
    const boundingBox = await editorEl.evaluate((node) => node.getBoundingClientRect());
    offsetX = offsetLeft + boundingBox.x;
    offsetY = offsetTop + boundingBox.y;
  }
  const firstPointer = pointers[0];
  let oldTimestamp = 0;
  if (firstPointer.t) {
    oldTimestamp = firstPointer.t;
  }
  await page.mouse.move(offsetX + firstPointer.x, offsetY + firstPointer.y);
  await page.mouse.down();
  for (const p of pointers) {
    let waitTime = 20;
    if (oldTimestamp > 0) {
      waitTime = p.t - oldTimestamp;
      oldTimestamp = p.t;
    }
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(waitTime / 10);
    await page.mouse.move(offsetX + p.x, offsetY + p.y);
  }
  await page.mouse.up();
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(150);
};

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
export const writeStrokes = async (page, strokes, offsetTop = 0, offsetLeft = 0) => {
  for (const s of strokes) {
    await writePointers(page, s.pointers, offsetTop, offsetLeft);
  }
};

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Configuration>
 */
export const getEditorConfiguration = async (page) => page.evaluate("editor.configuration");
/**
 * @param {Page} page - Playwright Page
 * @param {Configuration} configuration - Editor configuration
 * @returns Promise<void>
 */
export const setEditorConfiguration = async (page, configuration) => page.evaluate(`editor.configuration = ${JSON.stringify(configuration)};`);
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorExports = async (page) => page.evaluate("editor.model.exports");
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorExportsType = async (page, type) => page.evaluate(`editor.model.exports['${type}']`);
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorConverts = async (page) => page.evaluate("editor.model.converts");
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const getEditorSymbols = async (page) => page.evaluate("editor.model.symbols");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const callEditorExport = async (page, type) => {
  await page.waitForFunction(() => !!window.editor);
  const model = await page.evaluate(`editor.export(['${type}'])`);
  return model.exports[type];
};
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const callEditorSynchronize = async (page) => {
  await page.waitForFunction(() => !!window.editor);
  return  page.evaluate(`editor.behaviors.synchronizeStrokesWithJIIX()`);
};

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const callEditorIdle = async (page) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate("editor.waitForIdle()");
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const callEditoConvert = async (page) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate("editor.convert()");
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const callEditoClear = async (page) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate("editor.clear()");
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<unknow>
 */
export const waitForEvent = async (page, eventName) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate(`(async () => {
    return new Promise((resolve, reject) => {
      editor.event.addEventListener('${eventName}', (e) => {
        resolve(e.detail);
      }, { once: true });
    });
  })()`);
};

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const waitForExportedEvent = async (page) => waitForEvent(page, "exported");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
export const waitForImportedEvent = async (page) => waitForEvent(page, "imported");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForChangedEvent = async (page) => waitForEvent(page, "changed");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
export const waitForConvertedEvent = async (page) => waitForEvent(page, "converted");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForLoadedEvent = async (page) => waitForEvent(page, "loaded");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForUIUpdatedEvent = async (page) => waitForEvent(page, "ui-updated");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForSessionOpenedEvent = async (page) => waitForEvent(page, "session-opened");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForSynchronizedEvent = async (page) => waitForEvent(page, "synchronized");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForToolChangedEvent = async (page) => waitForEvent(page, "tool-changed");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForSelectedEvent = async (page) => waitForEvent(page, "selected");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
export const waitForGesturedEvent = async (page) => waitForEvent(page, "gestured");

export const waitForEditorInit = async (page) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate("editor.initializationPromise");
};

export const waitForServerConfiguration = async (page) => {
  return page.waitForResponse((req) => req.url().includes("server-configuration.json"));
};

export const findValuesByKey = (obj, key, list = []) => {
  if (!obj) return list;
  if (obj instanceof Array) {
    Object.keys(obj).forEach((k) => {
      list = list.concat(findValuesByKey(obj[k], key, []));
    });
    return list;
  }
  if (obj[key]) {
    if (obj[key] instanceof Array) {
      Object.keys(obj[key]).forEach((l) => {
        list.push(obj[key][l]);
      });
    } else {
      list.push(obj[key]);
    }
  }

  if (typeof obj === "object") {
    const children = Object.keys(obj);
    if (children.length > 0) {
      children.forEach((child) => {
        list = list.concat(findValuesByKey(obj[child], key, []));
      });
    }
  }
  return list;
}

export const haveSameLabels = (jiix1, jiix2) => {
  const labels1 = findValuesByKey(jiix1, "label");
  const labels2 = findValuesByKey(jiix2, "label");
  return JSON.stringify(labels1) === JSON.stringify(labels2);
};

export class DeferredPromise {
  constructor()
  {
    this.promise = new Promise((resolve, reject) =>
    {
      this.reject = async (v) =>
      {
        return reject(v)
      }
      this.resolve = async (v) =>
      {
        return resolve(v)
      }
    })
  }
}