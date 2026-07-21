import fetchMock from "jest-fetch-mock"
import {
  HTTPClientV1MathConfiguration,
  HTTPClientV1TextConfiguration,
  HTTPClientV1DiagramConfiguration,
  HTTPClientV1RawContentConfiguration,
} from "../__dataset__/configuration.dataset"
import {
  HTTPClientV2,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionTypeV2,
  THTTPClientV2Configuration,
  DefaultHTTPClientV2Configuration,
} from "@/iink"

describe("HTTPClientV2.ts", () => {
  const height = 100,
    width = 100

  beforeAll(() => {
    fetchMock.enableMocks()
  })
  afterEach(() => {
    fetchMock.resetMocks()
  })

  test("should instanciate HTTPClientV2", () => {
    const rr = new HTTPClientV2(DefaultHTTPClientV2Configuration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionTypeV2; config: THTTPClientV2Configuration }[] = [
    {
      type: "TEXT",
      config: HTTPClientV1TextConfiguration as unknown as THTTPClientV2Configuration,
    },
    {
      type: "SHAPE",
      config: HTTPClientV1DiagramConfiguration as unknown as THTTPClientV2Configuration,
    },
    {
      type: "MATH",
      config: HTTPClientV1MathConfiguration as unknown as THTTPClientV2Configuration,
    },
    {
      type: "Raw Content",
      config: HTTPClientV1RawContentConfiguration as unknown as THTTPClientV2Configuration,
    },
  ]

  testDatas.forEach(({ type, config }) => {
    test(`should send ${type}`, async () => {
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      const newConf: THTTPClientV2Configuration = structuredClone(config)
      newConf.recognition.type = type
      const rr = new HTTPClientV2(newConf)
      const newModel = await rr.send(model.symbols)

      let mimeTypes: string[]
      switch (type) {
        case "TEXT":
          mimeTypes = config.recognition.text.mimeTypes
          break
        case "SHAPE":
          mimeTypes = ["application/vnd.myscript.jiix"]
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
      expect(newModel).toBeDefined()
    })
  })
})
