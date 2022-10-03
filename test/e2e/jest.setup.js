jest.retryTimes(2)
jest.setTimeout(50 * 1000)

// global.beforeAll(() => {
// })

// global.beforeEach(() => {
// })

global.it = async function(name, func) {
  return test(name, async () => {
    try {
      await func()
    } catch (e) {
      // eslint-disable-next-line no-console
      // console.error(name, e);
      const fileName = `${name}_${new Date()}`
      if (page && !page.isClosed()) {
        if (process.env.JOB_BASE_NAME && process.env.BUILD_NUMBER) {
          await page.screenshot({ fullPage: false, path: `test/e2e/screenshots/${process.env.JOB_BASE_NAME}/${process.env.BUILD_NUMBER}/${fileName}.png` })
        } else {
          await page.screenshot({ fullPage: false, path: `test/e2e/screenshots/${fileName}.png`  })
        }
      }
      throw e
    }
  })
}

// global.afterEach(() => {
// })

global.afterAll(() => {
  browser.close()
})
