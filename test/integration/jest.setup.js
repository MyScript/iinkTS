jest.retryTimes(2)
jest.setTimeout(30 * 1000)

global.it = async function(name, func) {
  return test(name, async () => {
    try {
      await func()
    } catch (e) {
      const fileName = `${name}_${new Date()}`
      if (page && !page.isClosed()) {
        if (process.env.JOB_BASE_NAME && process.env.BUILD_NUMBER) {
          await page.screenshot({ fullPage: true, path: `test/integration/screenshots/${process.env.JOB_BASE_NAME}/${process.env.BUILD_NUMBER}/${fileName}.png` })
        } else {
          await page.screenshot({ fullPage: true, path: `test/integration/screenshots/${fileName}.png`  })
        }
      }
      throw e
    }
  })
}

// global.afterAll(() => {
//   browser.close()
// })
