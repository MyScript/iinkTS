jest.retryTimes(2)
jest.setTimeout(30 * 1000)

global.testIf = (condition, ...args) => condition ? test(...args) : test.skip(...args)
