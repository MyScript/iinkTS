global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
console.log = jest.fn()
console.warn = jest.fn()
console.error = jest.fn()
