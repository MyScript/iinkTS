/**
 * @param {Page} page - Playwright Page
 * @param {Array} strokes
 * @param {Object} strokes[0]
 * @param {Array} strokes[0].x
 * @param {Number} strokes[0].x[0]
 * @param {Array} strokes[0].y
 * @param {Number} strokes[0].y[0]
 * @param {Array} [strokes[0].t]
 * @param {Number} strokes[0].t[0]
 * @param {Number} [offsetTop=0]
 * @param {Number} [offsetLeft=0]
 */
module.exports.write = async (page, strokes, offsetTop = 0, offsetLeft = 0) => {

  const editorEl = await page.waitForSelector('#editor')
  const offsetX = offsetLeft + await editorEl.evaluate((node) => node.offsetLeft)
  const offsetY = offsetTop + await editorEl.evaluate((node) => node.offsetTop)

  for (const { x, y, t } of strokes) {
    const hasTimeStamp = t && t.length === x.length
    await page.mouse.move(offsetX + x[0], offsetY + y[0])
    await page.mouse.down()

    let oldTimestamp = hasTimeStamp ? t[0] : null
    for (let p = 0; p < x.length; p++) {
      let waitTime = 0
      if (hasTimeStamp) {
        waitTime = t[p] - oldTimestamp
        oldTimestamp = t[p]
      }
      await page.waitForTimeout(waitTime)
      await page.mouse.move(offsetX + x[p], offsetY + y[p])
    }
    await page.mouse.up()
    await page.waitForTimeout(100)
  }
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Editor>
 */
module.exports.getEditor = async (page) => {
  return page.evaluate('editor')
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Configuration>
 */
module.exports.getEditorConfiguration = async (page) => {
  return page.evaluate('editor.configuration')
}

/**
 * @param {Page} page - Playwright Page
 * @param {Configuration} configuration - Editor configuration
 * @returns Promise<void>
 */
module.exports.setEditorConfiguration = async (page, configuration) => {
  return page.evaluate(`editor.configuration = ${JSON.stringify(configuration)};`)
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
 module.exports.getEditorModelExports = async (page) => {
  return page.evaluate('editor.model.exports')
}
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
 module.exports.getEditorModelConverts = async (page) => {
  return page.evaluate('editor.model.converts')
}
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
 module.exports.getEditorModelExportsType = async (page, type) => {
  return page.evaluate(`editor.model.exports['${type}']`)
}

const exported = `(async () => {
  return new Promise((resolve, reject) => {
    editor.events.addEventListener('exported', (e) => {
      resolve(e.detail);
    });
  });
})()`

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
module.exports.getExportedDatas = async (page) => {
  return page.evaluate(exported)
}

const converted = `(async () => {
  return new Promise((resolve, reject) => {
    editor.events.addEventListener('converted', (e) => {
      resolve(e.detail);
    });
  });
})()`

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
module.exports.getConvertedDatas = async (page) => {
  return page.evaluate(converted)
}

const loaded = `(async () => {
  return new Promise((resolve, reject) => {
    editor.events.addEventListener('loaded', (e) => {
      resolve();
    });
  });
})()`
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitEditorLoaded = async (page) => {
  return page.evaluate(loaded)
}

module.exports.waitForEditorRest = async (page) => {
  await Promise.all([
    page.waitForSelector('#ms-rendering-canvas'),
    page.waitForSelector('#ms-capture-canvas'),
  ])
  return page.evaluate('editor.initializationPromise')
}

module.exports.waitForEditorWebSocket = async (page) => {
  await Promise.all([
    page.waitForSelector('svg[data-layer="CAPTURE"]'),
    page.waitForSelector('svg[data-layer="MODEL"]'),
  ])
  return page.evaluate('editor.initializationPromise')
}
