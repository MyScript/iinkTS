jest.retryTimes(1)
jest.setTimeout(30 * 1000)

afterAll(() => {
  browser.close()
})
