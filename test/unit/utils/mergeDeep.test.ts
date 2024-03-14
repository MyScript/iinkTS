import { mergeDeep } from "../../../src/iink"

describe("merge", () =>
{
  const testDatas = [
    { source: { a: 1, b: 2 }, target: { a: 1, b: 3 }, expected: { a: 1, b: 3 } },
    { source: { b: 2 }, target: { a: 1, b: 3 }, expected: { a: 1, b: 3 } },
    { source: { a: 1, b: 2 }, target: { a: 1 }, expected: { a: 1, b: 2 } },
    { source: { a: 1, b: { c: 1 } }, target: { a: 1 }, expected: { a: 1, b: { c: 1 } } },
    { source: { a: 1 }, target: { a: 1, b: { c: 1 } }, expected: { a: 1, b: { c: 1 } } },
    { source: { a: 1, b: { c: 1 } }, target: { a: 1, b: { d: 4 } }, expected: { a: 1, b: { c: 1, d: 4 } } },
    { source: { a: 1, b: ["a", "b"] }, target: { a: 1 }, expected: { a: 1, b: ["a", "b"] } },
    { source: { a: 1 }, target: { a: 1, b: ["a", "b"] }, expected: { a: 1, b: ["a", "b"] } },
    { source: [1, 2], target: ["a", "b"], expected: [1, 2, "a", "b"] },
    { source: "pouet", target: "yolo", expected: "yolo" },
  ]
  testDatas.forEach(d =>
  {
    test(`shoud mergeDeep ${ JSON.stringify(d.source) } with ${ JSON.stringify(d.target) } to ${ JSON.stringify(d.expected) }`, () =>
    {
      expect(mergeDeep(d.source, d.target)).toEqual(d.expected)
    })
  })
})
