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
 * @param {Number} [offsetX=0]
 * @param {Number} [offsetY=0]
 */
module.exports.write = async (page, strokes, offsetX = 0, offsetY = 0) => {
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
