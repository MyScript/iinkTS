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
    await page.waitForTimeout(500)
  }
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
module.exports.writeStrokesPointers = async (page, strokes, offsetTop = 0, offsetLeft = 0) => {
  const editorEl = await page.waitForSelector('#editor')
  const boundingBox = await editorEl.evaluate((node) => node.getBoundingClientRect())
  const offsetX = offsetLeft + boundingBox.x
  const offsetY = offsetTop + boundingBox.y
  for(s of strokes) {
    const firstPointer = s.pointers[0]
    let oldTimestamp = firstPointer.t
    await page.mouse.move(offsetX + firstPointer.x, offsetY + firstPointer.y)
    await page.mouse.down()
    for(p of s.pointers) {
      let waitTime = 0
      waitTime = p.t - oldTimestamp
      oldTimestamp = p.t
      await page.waitForTimeout(waitTime)
      await page.mouse.move(offsetX + p.x, offsetY + p.y)
    }
    await page.mouse.up()
    await page.waitForTimeout(500)
  }
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
module.exports.writePointers = async (page, pointers, offsetTop = 0, offsetLeft = 0) => {
  const editorEl = await page.waitForSelector('#editor')
  const boundingBox = await editorEl.evaluate((node) => node.getBoundingClientRect())
  const offsetX = offsetLeft + boundingBox.x
  const offsetY = offsetTop + boundingBox.y
  const firstPointer = pointers[0]
  let oldTimestamp = firstPointer.t
  await page.mouse.move(offsetX + firstPointer.x, offsetY + firstPointer.y)
  await page.mouse.down()
  for(p of pointers) {
    let waitTime = 0
    waitTime = p.t - oldTimestamp
    oldTimestamp = p.t
    await page.waitForTimeout(waitTime)
    await page.mouse.move(offsetX + p.x, offsetY + p.y)
  }
  await page.mouse.up()
  await page.waitForTimeout(500)
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
 module.exports.getExportsFromEditorModel = async (page) => {
  return page.evaluate('editor.model.exports')
}
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
 module.exports.getConvertsFromEditorModel = async (page) => {
  return page.evaluate('editor.model.converts')
}
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<TExport>
 */
 module.exports.getExportsTypeFromEditorModel = async (page, type) => {
  return page.evaluate(`editor.model.exports['${type}']`)
}

const exported = `(async () => {
  return new Promise((resolve, reject) => {
    editor.event.addEventListener('exported', (e) => {
      resolve(e.detail);
    });
  });
})()`

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
module.exports.getDatasFromExportedEvent = async (page) => {
  return page.evaluate(exported)
}

const imported = `(async () => {
  return new Promise((resolve, reject) => {
    editor.event.addEventListener('imported', (e) => {
      resolve(e.detail);
    });
  });
})()`

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
module.exports.getDatasFromImportedEvent = async (page) => {
  return page.evaluate(imported)
}

const converted = `(async () => {
  return new Promise((resolve, reject) => {
    editor.event.addEventListener('converted', (e) => {
      resolve(e.detail);
    });
  });
})()`

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<Exports>
 */
module.exports.getDatasFromConvertedEvent = async (page) => {
  await page.waitForFunction(() => !!window.editor)
  return page.evaluate(converted)
}

/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitEditorIdle = async (page) => {
  await page.waitForFunction(() => !!window.editor)
  return page.evaluate("editor.waitForIdle()")
}

const loaded = `(async () => {
  return new Promise((resolve, reject) => {
    editor.event.addEventListener('loaded', (e) => {
      resolve();
    });
  });
})()`
/**
 * @param {Page} page - Playwright Page
 * @returns Promise<void>
 */
module.exports.waitEditorLoaded = async (page) => {
  await page.waitForFunction(() => !!window.editor)
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

module.exports.waitForServerConfiguration = async (page) => {
  return page.waitForResponse(req => req.url().includes('server-configuration.json'))
}

module.exports.waitForEditorOffscreen = async (page) => {
  await Promise.all([
    page.waitForSelector('#editor .ms-layer-infos'),
    page.waitForSelector('#editor svg'),
  ])
  return page.evaluate('editor.initializationPromise')
}

function findValuesByKey (obj, key, list = []) {
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

  if (typeof obj === 'object') {
    const children = Object.keys(obj)
    if (children.length > 0) {
      children.forEach((child) => {
        list = list.concat(findValuesByKey(obj[child], key, []))
      })
    }
  }
  return list
}
module.exports.findValuesByKey = findValuesByKey

module.exports.haveSameLabels = (jiix1, jiix2) => {
  const labels1 = findValuesByKey(jiix1, 'label')
  const labels2 = findValuesByKey(jiix2, 'label')
  return JSON.stringify(labels1) === JSON.stringify(labels2)
}
