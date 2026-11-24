import fetchMock from "jest-fetch-mock"
import { HTTPClientV1MathConfiguration, HTTPClientV1TextConfiguration, HTTPClientV1DiagramConfiguration, HTTPClientV1RawContentConfiguration } from "../../__dataset__/configuration.dataset"
import { HTTPClientV2, DefaultPenStyle, Model, TPointer, TRecognitionTypeV2, THTTPClientV2Configuration, DefaultHTTPClientV2Configuration, computeHmac } from "@/iink"

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

  test("should strip export.jiix.text.lines when the server version is below 3.2.0", async () => {
    const model = new Model(width, height)
    const p1: TPointer = { dt: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { dt: 10, p: 1, x: 100, y: 1 }
    model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    model.endCurrentStroke(p2)
    const newConf: THTTPClientV2Configuration = structuredClone(
      HTTPClientV1RawContentConfiguration as unknown as THTTPClientV2Configuration
    )
    newConf.recognition.type = "Raw Content"
    const rr = new HTTPClientV2(newConf)
    rr.configuration.recognition.export.jiix.text.lines = true

    await rr.send(model.symbols)

    const request = fetchMock.mock.calls[0][0] as Request
    const sentBody = await request.clone().json()
    expect(sentBody.configuration.export.jiix.text.lines).toBeUndefined()
  })

  test("should send t0 and dt instead of t to a server from 4.6.0", async () => {
    const model = new Model(width, height)
    model.initCurrentStroke({ dt: 1, p: 1, x: 1, y: 1 }, "pen", DefaultPenStyle)
    model.endCurrentStroke({ dt: 10, p: 1, x: 100, y: 1 })
    const newConf: THTTPClientV2Configuration = structuredClone(
      HTTPClientV1RawContentConfiguration as unknown as THTTPClientV2Configuration
    )
    newConf.recognition.type = "Raw Content"
    newConf.server.version = "4.6.0"
    const rr = new HTTPClientV2(newConf)

    await rr.send(model.symbols)

    const request = fetchMock.mock.calls[0][0] as Request
    const [sent] = (await request.clone().json()).strokes
    expect(sent.t).toBeUndefined()
    expect(sent.dt).toEqual([0, 9])
  })

  test("should ask the server version before writing the strokes when it is not known yet", async () => {
    const model = new Model(width, height)
    model.initCurrentStroke({ dt: 1, p: 1, x: 1, y: 1 }, "pen", DefaultPenStyle)
    model.endCurrentStroke({ dt: 10, p: 1, x: 100, y: 1 })
    const newConf: THTTPClientV2Configuration = structuredClone(
      HTTPClientV1RawContentConfiguration as unknown as THTTPClientV2Configuration
    )
    newConf.recognition.type = "Raw Content"
    delete newConf.server.version
    fetchMock.mockResponseOnce(JSON.stringify({ version: "4.6.0", gitCommit: "", nativeVersion: "" }))
    const rr = new HTTPClientV2(newConf)

    await rr.send(model.symbols)

    const request = fetchMock.mock.calls[1][0] as Request
    const [sent] = (await request.clone().json()).strokes
    expect(sent.dt).toEqual([0, 9])
  })

  test("should sign the body it actually sends, after adapting the configuration to the server version", async () => {
    const model = new Model(width, height)
    model.initCurrentStroke({ dt: 1, p: 1, x: 1, y: 1 }, "pen", DefaultPenStyle)
    model.endCurrentStroke({ dt: 10, p: 1, x: 100, y: 1 })
    const newConf: THTTPClientV2Configuration = structuredClone(
      HTTPClientV1RawContentConfiguration as unknown as THTTPClientV2Configuration
    )
    newConf.recognition.type = "Raw Content"
    const rr = new HTTPClientV2(newConf)
    rr.configuration.recognition.export.jiix.text.lines = true

    await rr.send(model.symbols)

    const request = fetchMock.mock.calls[0][0] as Request
    const { applicationKey, hmacKey } = rr.configuration.server
    const expected = await computeHmac(await request.clone().text(), applicationKey, hmacKey)
    expect(request.headers.get("hmac")).toEqual(expected)
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
      const p1: TPointer = { dt: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { dt: 10, p: 1, x: 100, y: 1 }
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
