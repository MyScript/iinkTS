import { ConfigurationTextWebsocket } from "../_dataset/configuration.dataset"
import {
  getAvailableLanguageList,
  getAvailableFontList,
  mergeDeep,
  isVersionSuperiorOrEqual,
  convertMillimeterToPixel,
  convertPixelToMillimeter,
  computeHmac,
  computeAngleAxeRadian,
  computeDistance,
  computeLinksPointers,
  computeMiddlePointer,
  TPointer,
 } from "../../../src/iink"

const round = (n: number, digit = 2) => Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)

describe("utils", () =>
{
  describe("getAvailableLanguageList", () =>
  {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ fr: "fr_FR" }),
      }),
    ) as jest.Mock

    test("should call fetch with good url", async () =>
    {
      await getAvailableLanguageList(ConfigurationTextWebsocket)
      expect(fetch).toBeCalledTimes(1)
      expect(fetch).toBeCalledWith(`${ ConfigurationTextWebsocket?.server?.scheme }://${ ConfigurationTextWebsocket?.server?.host }/api/v4.0/iink/availableLanguageList`)
    })

    test("should reject getAvailableLanguageList if no configuration", async () =>
    {
      // @ts-ignore
      getAvailableLanguageList()
        .catch(e =>
        {
          expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableLanguageList if configuration.server is empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.server
      getAvailableLanguageList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableLanguageList if configuration.server.scheme is empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.server?.scheme
      getAvailableLanguageList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableLanguageList if configuration.server.host empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.server?.host
      getAvailableLanguageList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
        })
    })
  })

  describe("getAvailableFontList", () =>
  {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ result: [] }),
      }),
    ) as jest.Mock

    test("should call fetch with good url", async () =>
    {
      await getAvailableFontList(ConfigurationTextWebsocket)
      expect(fetch).toBeCalledTimes(1)
      expect(fetch).toBeCalledWith(`${ ConfigurationTextWebsocket?.server?.scheme }://${ ConfigurationTextWebsocket?.server?.host }/api/v4.0/iink/font/google/language/${ ConfigurationTextWebsocket?.recognition?.lang }`)
    })

    test("should reject getAvailableFontList if no configuration", async () =>
    {
      // @ts-ignore
      getAvailableFontList()
        .catch(e =>
        {
          expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableFontList if configuration.server is empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.server
      getAvailableFontList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableFontList if configuration.server.scheme is empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.server?.scheme
      getAvailableFontList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableFontList if configuration.server.host empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.server?.host
      getAvailableFontList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
        })
    })

    test("should reject getAvailableFontList if configuration.server.host empty", async () =>
    {
      const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
      delete conf?.recognition?.lang
      getAvailableFontList(conf)
        .catch(e =>
        {
          expect(e).toBe("Failed to get fonts: configuration.recognition.lang is required!")
        })
    })
  })

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

  describe("math", () =>
  {
    describe("computeDistance", () =>
    {
      const testDatas = [
        {
          p1: { x: 0, y: 0 },
          p2: { x: 0, y: 3 },
          expected: 3
        },
        {
          p1: { x: 0, y: 0 },
          p2: { x: 3, y: 0 },
          expected: 3
        },
        {
          p1: { x: 0, y: 0 },
          p2: { x: 1, y: 1 },
          expected: Math.sqrt(2)
        },
      ]
      testDatas.forEach(d =>
      {
        test(`should computed distance of P1: [${ JSON.stringify(d.p1) }] & P2: [${ JSON.stringify(d.p2) }] to equal ${ d.expected }`, () =>
        {
          expect(computeDistance(d.p1, d.p2)).toEqual(d.expected)
        })
      })
    })

    describe("computeAngleAxeRadian", () =>
    {
      const testDatas = [
        {
          p1: { x: 0, y: 0 },
          p2: { x: 10, y: 0 },
          expect: 0
        },
        {
          p1: { x: 10, y: 0 },
          p2: { x: 0, y: 0 },
          expect: 3.14
        },
        {
          p1: { x: 0, y: 0 },
          p2: { x: 0, y: 1 },
          expect: 1.5708
        },
        {
          p1: { x: 0, y: 1 },
          p2: { x: 0, y: 0 },
          expect: -1.5708
        },
        {
          p1: { x: 0, y: 0 },
          p2: { x: 1, y: 1 },
          expect: 0.79
        },
        {
          p1: { x: 1, y: 1 },
          p2: { x: 0, y: 0 },
          expect: -2.36
        },
        {
          p1: { x: 0, y: 0 },
          p2: { x: 3, y: 1 },
          expect: 0.32
        },
        {
          p1: { x: 3, y: 0 },
          p2: { x: 0, y: 1 },
          expect: 2.82
        },
      ]
      testDatas.forEach(d =>
      {
        test(`should compute radian for P1[${ JSON.stringify(d.p1) }] P2[${ JSON.stringify(d.p2) }] to equal ${ d.expect }`, () =>
        {
          expect(round(computeAngleAxeRadian(d.p1, d.p2))).toEqual(round(d.expect))
        })
      })
    })

    describe("quadratics", () => {
      const p1: TPointer = {
        p: 1,
        t: 1,
        x: 1,
        y: 1
      }
      const p2: TPointer = {
        p: 1,
        t: 1,
        x: 2,
        y: 5
      }
      test("should computeLinksPointers", () =>
      {
        const points = computeLinksPointers(p1, 90, 1)
        expect(points).toStrictEqual([
          {
            x: 0.10600333639944215,
            y: 0.5519263838708298
          },
          {
            x: 1.8939966636005579,
            y: 1.4480736161291703
          }
        ])
      })

      test("should computeMiddlePointer", () =>
      {
        const point = computeMiddlePointer(p1, p2)
        expect(point).toStrictEqual({ x: 1.5, y: 3, p: 1, t: 1 })
      })
    })
  })

  describe("units", () =>
  {
    test("convertMillimeterToPixel", () =>
    {
      expect(round(convertMillimeterToPixel(10), 0)).toEqual(38)
    })
    test("convertPixelToMillimeter", () =>
    {
      expect(round(convertPixelToMillimeter(38), 0)).toEqual(10)
    })
  })

  describe("crypto", () =>
  {
    test("should computeHmac", () =>
    {
      const computedHmac = computeHmac("Message", "AppKey", "HMACKey")
      expect(computedHmac)
        .toBe("b4d62a1900a4010a140e31fc4a07b6445499e6c7488f3214962427b2d539056182d0990f4d042ace794704f03dc6fdc2f73e25dd6ea35d3e0fd537d1dd4c1223")
    })

  })
})
