import fetchMock from "jest-fetch-mock"
import {
  HTTPClientV1DiagramConfiguration,
  HTTPClientV1MathConfiguration,
  HTTPClientV1RawContentConfiguration,
  HTTPClientV1TextConfiguration,
} from "../__dataset__/configuration.dataset"
import {
  HTTPClientV1,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionTypeV1,
  THTTPClientV1Configuration,
  DefaultHTTPClientV1Configuration,
} from "@/iink"

describe("HTTPClientV1.ts", () => {
  const height = 100,
    width = 100

  beforeAll(() => {
    fetchMock.enableMocks()
  })
  afterEach(() => {
    fetchMock.resetMocks()
  })

  test("should instanciate HTTPClientV1", () => {
    const rr = new HTTPClientV1(DefaultHTTPClientV1Configuration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionTypeV1; config: THTTPClientV1Configuration }[] = [
    {
      type: "TEXT",
      config: HTTPClientV1TextConfiguration as THTTPClientV1Configuration,
    },
    {
      type: "DIAGRAM",
      config: HTTPClientV1DiagramConfiguration as THTTPClientV1Configuration,
    },
    {
      type: "MATH",
      config: HTTPClientV1MathConfiguration as THTTPClientV1Configuration,
    },
    {
      type: "Raw Content",
      config: HTTPClientV1RawContentConfiguration as THTTPClientV1Configuration,
    },
  ]

  testDatas.forEach(({ type, config }) => {
    test(`should export ${type}`, async () => {
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      const newConf: THTTPClientV1Configuration = structuredClone(config)
      newConf.recognition.type = type

      const rr = new HTTPClientV1(newConf)
      const newModel = await rr.export(model)

      let mimeTypes = []
      switch (type) {
        case "TEXT":
          mimeTypes = config.recognition.text!.mimeTypes
          break
        case "DIAGRAM":
          mimeTypes = config.recognition.diagram!.mimeTypes
          break
        case "MATH":
          mimeTypes = config.recognition.math!.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break

        default:
          throw new Error("invalid recognition type")
      }
      expect(fetchMock).toHaveBeenCalledTimes(mimeTypes.length)
      expect(model.exports).toBeUndefined()
      mimeTypes.forEach((m) => {
        expect(newModel.exports![m]).toBeDefined()
      })
    })
  })

  testDatas.forEach(({ type, config }) => {
    test(`should convert ${type}`, async () => {
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      const newConf: THTTPClientV1Configuration = structuredClone(config)
      newConf.recognition.type = type
      const rr = new HTTPClientV1(newConf)
      const newModel = await rr.convert(model, "DIGITAL_EDIT")

      let mimeTypes: string[]
      switch (type) {
        case "TEXT":
          mimeTypes = config.recognition.text!.mimeTypes
          break
        case "DIAGRAM":
          mimeTypes = config.recognition.diagram!.mimeTypes
          break
        case "MATH":
          mimeTypes = config.recognition.math!.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break
        default:
          throw new Error("Invalid recognition type")
      }

      expect(fetchMock).toHaveBeenCalledTimes(mimeTypes.length)
      expect(model.converts).toBeUndefined()
      mimeTypes.forEach((m) => {
        expect(newModel.converts![m]).toBeDefined()
      })
    })
  })
})
