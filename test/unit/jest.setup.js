jest.retryTimes(0)
global.structuredClone = (val) => val ? JSON.parse(JSON.stringify(val)) : undefined
console.warn = jest.fn()
console.error = jest.fn()
