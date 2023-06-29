jest.retryTimes(2)
jest.setTimeout(30 * 1000)

afterAll(() => {
  browser.close()
})
