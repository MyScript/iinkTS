jest.retryTimes(2)
jest.setTimeout(10 * 1000)

// global.beforeAll(() => {
//   page.on('console', data => {
//     console.log('==>> console', data)
//   })
//   page.on('request', async (request) => {
//     if (
//       request.url().indexOf('.css') === -1 &&
//       request.url().indexOf('.js') === -1 &&
//       request.url().indexOf('.svg') === -1
//     ) {
//       console.log('==>> request', request.method(), request.url())
//       // , JSON.stringify(request.postDataJSON()
//     }
//   })
//   // page.on('requestfinished', async (request) => {
//   //   try {
//   //     const response = await request.response()
//   //     const url = request.url()
//   //     if (
//   //       url.indexOf('.css') === -1 &&
//   //       url.indexOf('.js') === -1 &&
//   //       url.indexOf('.svg') === -1 &&
//   //       url.indexOf('.html') === -1 &&
//   //       response.status() != 200
//   //     ) {
//   //       console.log('==>> requestfinished', request.method(), url, JSON.stringify(request.postDataJSON()), response.status(), response.statusText())
//   //     }
//   //   } catch (error) {
//   //     console.log('==>> requestfinished error: ', error)
//   //   }
//   // })
//   page.on('requestfailed', async (requestfailed) => {
//     try {
//       console.log('======>> requestfailed', requestfailed.method(), requestfailed.url(), requestfailed.failure())
//     } catch (error) {
//       console.log('======>> requestfailed error: ', error);
//     }
//   })
//   page.on('pageerror', (error) => {
//     console.error('===========>> pageerror', error)
//   })
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
          await page.screenshot({ fullPage: false, path: `test/integration/screenshots/${process.env.JOB_BASE_NAME}/${process.env.BUILD_NUMBER}/${fileName}.png` })
        } else {
          await page.screenshot({ fullPage: false, path: `test/integration/screenshots/${fileName}.png`  })
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
