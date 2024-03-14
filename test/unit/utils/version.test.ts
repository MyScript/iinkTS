import { isVersionSuperiorOrEqual } from "../../../src/iink"

describe("version", () =>
{
  const testDatas = [
    { source: "1.0.1", target: "1.0.0", expected: true },
    { source: "1.1.0", target: "1.0.0", expected: true },
    { source: "2.0.0", target: "1.0.0", expected: true },
    { source: "2.0.0", target: "1.9.14", expected: true },
    { source: "2.12.90", target: "2.12.88", expected: true },
    { source: "1.99.99", target: "2.0.0", expected: false },
    { source: "2.0.9", target: "2.0.91", expected: false },
    { source: "2.11.9", target: "2.12.88", expected: false },
    { source: "1.0.0", target: "1.0.0", expected: true },
  ]
  testDatas.forEach(d =>
  {
    test(`shoud get ${ d.source } is ${ d.expected ? "higher" : "lower" } than ${ d.target }`, () =>
    {
      expect(isVersionSuperiorOrEqual(d.source, d.target)).toEqual(d.expected)
    })
  })
})
