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
module.exports.writeStrokes = async (page, strokes, offsetTop = 0, offsetLeft = 0) => {
  for (s of strokes) {
    await this.writePointers(page, s.pointers, offsetTop, offsetLeft);
  }
};

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
module.exports.writePointers = async (page, pointers, offsetTop = 0, offsetLeft = 0) => {
  const editorEl = await page.waitForSelector("#editor");
  const boundingBox = await editorEl.evaluate((node) => node.getBoundingClientRect());
  const offsetX = offsetLeft + boundingBox.x;
  const offsetY = offsetTop + boundingBox.y;
  const firstPointer = pointers[0];
  let oldTimestamp = 0;
  if (firstPointer.t) {
    oldTimestamp = firstPointer.t;
  }
  await page.mouse.move(offsetX + firstPointer.x, offsetY + firstPointer.y);
  await page.mouse.down();
  for (p of pointers) {
    let waitTime = 20;
    if (oldTimestamp > 0) {
      waitTime = p.t - oldTimestamp;
      oldTimestamp = p.t;
    }
    await page.waitForTimeout(waitTime);
    await page.mouse.move(offsetX + p.x, offsetY + p.y);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
};

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Configuration>
 */
module.exports.getEditorConfiguration = async (page) => page.evaluate("editor.configuration");
/**
 * @param {Page} page - Playwright Page
 * @param {Configuration} configuration - Editor configuration
 * @returns Promise<void>
 */
module.exports.setEditorConfiguration = async (page, configuration) => page.evaluate(`editor.configuration = ${JSON.stringify(configuration)};`);
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
module.exports.getExportsFromEditorModel = async (page) => page.evaluate("editor.model.exports");
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
module.exports.getConvertsFromEditorModel = async (page) => page.evaluate("editor.model.converts");
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
module.exports.getExportsTypeFromEditorModel = async (page, type) => page.evaluate(`editor.model.exports['${type}']`);
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
module.exports.sendAndGetExportsTypeFromEditorModel = async (page, type) => {
  await page.waitForFunction(() => !!window.editor);
  const model = await page.evaluate(`editor.export(['${type}'])`);
  return model.exports[type];
};

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitEditorIdle = async (page) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate("editor.waitForIdle()");
}

const waitForEditorEvent = async (page, eventName) => {
  await page.waitForFunction(() => !!window.editor);
  return page.evaluate(`(async () => {
    return new Promise((resolve, reject) => {
      editor.event.addEventListener('${eventName}', (e) => {
        resolve(e.detail);
      });
    });
  })()`);
};
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<unknow>
 */
module.exports.waitForEditorEvent = waitForEditorEvent;

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
module.exports.getDatasFromExportedEvent = async (page) => waitForEditorEvent(page, "exported");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
module.exports.getDatasFromImportedEvent = async (page) => waitForEditorEvent(page, "imported");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitChanged = async (page) => waitForEditorEvent(page, "changed");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
module.exports.getDatasFromConvertedEvent = async (page) => waitForEditorEvent(page, "converted");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitEditorLoaded = async (page) => waitForEditorEvent(page, "loaded");

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitEditorUIUpdated = async (page) => waitForEditorEvent(page, "ui-updated");



/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitSessionOpened = async (page) => waitForEditorEvent(page, "session-opened");

module.exports.waitForEditorRest = async (page) => {
  await Promise.all([page.waitForSelector("#ms-rendering-canvas"), page.waitForSelector("#ms-capture-canvas")]);
  return page.evaluate("editor.initializationPromise");
};

module.exports.waitForEditorWebSocket = async (page) => {
  await Promise.all([page.waitForSelector('svg[data-layer="CAPTURE"]'), page.waitForSelector('svg[data-layer="MODEL"]')]);
  return page.evaluate("editor.initializationPromise");
};

module.exports.waitForServerConfiguration = async (page) => {
  return page.waitForResponse((req) => req.url().includes("server-configuration.json"));
};

module.exports.waitForEditorOffscreen = async (page) => {
  await Promise.all([page.waitForSelector("#editor .ms-layer-ui"), page.waitForSelector("#editor svg")]);
  return page.evaluate("editor.initializationPromise");
};

function findValuesByKey(obj, key, list = []) {
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
module.exports.findValuesByKey = findValuesByKey;

module.exports.haveSameLabels = (jiix1, jiix2) => {
  const labels1 = findValuesByKey(jiix1, "label");
  const labels2 = findValuesByKey(jiix2, "label");
  return JSON.stringify(labels1) === JSON.stringify(labels2);
};
