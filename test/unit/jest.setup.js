jest.retryTimes(0)
global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
console.warn = jest.fn()
console.error = jest.fn()
