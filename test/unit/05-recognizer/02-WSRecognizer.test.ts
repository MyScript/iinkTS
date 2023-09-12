import Server from "jest-websocket-mock"
import { DeserializedMessage } from "jest-websocket-mock/lib/websocket"
import { delay } from "../utils/helpers"
import
{
  TWebSocketEvent,
  IModel,
  TTheme,
  TPenStyle,
  TServerConfiguration,
  TConverstionState,
  TRecognitionConfiguration,
  TRecognitionType,
  TPointer,
} from "../../../src/@types"
import
{
  DefaultRecognitionConfiguration,
  DefaultServerConfiguration,
  WSRecognizer,
  Model,
  DefaultPenStyle,
  Constants,
} from "../../../src/iink"

const ackMessage = { "type": "ack", "hmacChallenge": "1f434e8b-cc46-4a8c-be76-708eea2ff305", "iinkSessionId": "c7e72186-6299-4782-b612-3e725aa126f1" }
const contentPackageDescriptionMessage = { "type": "contentPackageDescription", "contentPartCount": 0 }
const partChangeMessage = { "type": "partChanged", "partIdx": 0, "partId": "yyrrutgk", "partCount": 1 }
const newPartMessage = { "type": "newPart", "idx": 0, "id": "lqrcoxjl" }

const emptyJIIX = {
  "type": "Text",
  "label": "",
  "words": [],
}
const emptyExportedMessage = {
  "type": "exported",
  "partId": "wyybaqsp",
  "exports": {
    "application/vnd.myscript.jiix": JSON.stringify(emptyJIIX)
  }
}
const hJIIX = {
  "type": "Text",
  "label": "hello",
  "words": [{
    "label": "H",
    "candidates": ["h"]
  }]
}
const hExportedMessage = {
  "type": "exported",
  "partid": 0,
  "exports": {
    "application/vnd.myscript.jiix": JSON.stringify(hJIIX)
  }
}
const svgPatchMessage = {
  "type": "svgPatch",
  "updates": [
    {
      "type": "REMOVE_ELEMENT",
      "id": "MODEL-dg7f8894033c80"
    },
    {
      "type": "SET_ATTRIBUTE",
      "name": "viewBox",
      "value": "0 0 967 790"
    },
    {
      "type": "SET_ATTRIBUTE",
      "name": "width",
      "value": "967px"
    },
    {
      "type": "INSERT_BEFORE",
      "refId": "G7f8814290820-",
      "svg": "<g id=\"G7f881429b700-\">\n  <g id=\"MODEL-dg7f8894033d00\">\n    <line x1=\"10\" y1=\"35\" x2=\"245.85\" y2=\"35\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"50\" x2=\"245.85\" y2=\"50\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"65\" x2=\"245.85\" y2=\"65\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"80\" x2=\"245.85\" y2=\"80\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"95\" x2=\"245.85\" y2=\"95\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"110\" x2=\"245.85\" y2=\"110\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"125\" x2=\"245.85\" y2=\"125\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"140\" x2=\"245.85\" y2=\"140\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"155\" x2=\"245.85\" y2=\"155\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"170\" x2=\"245.85\" y2=\"170\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"185\" x2=\"245.85\" y2=\"185\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"200\" x2=\"245.85\" y2=\"200\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n  </g>\n</g>\n"
    },
    {
      "type": "REMOVE_ELEMENT",
      "id": "G7f8814290820-"
    }
  ],
  "layer": "MODEL"
}
const errorMessage = { "type": "error", "message": "Access not granted", "code": "access.not.granted" }
const recognitionTypeList: TRecognitionType[] = ["TEXT", "DIAGRAM", "MATH", "Raw Content"]

const getMessages = (messages: DeserializedMessage<object>[], type: string): DeserializedMessage<object>[] =>
{
  return messages.filter((m: DeserializedMessage<object>) =>
  {
    const parseMessage = JSON.parse(m as string) as TWebSocketEvent
    return parseMessage.type === type
  })
}

describe("WSRecognizer.ts", () =>
{
  let mockServer: Server
  const height = 100, width = 100
  beforeEach(() =>
  {
    mockServer = new Server(`wss://${ DefaultServerConfiguration.host }/api/v4.0/iink/document`, {})

    mockServer.on("connection", (socket) =>
    {
      socket.on("message", (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
      {
        const parsedMessage: TWebSocketEvent = JSON.parse(message as string)
        switch (parsedMessage.type) {
          case "newContentPackage":
            socket.send(JSON.stringify(ackMessage))
            break
          case "hmac":
            socket.send(JSON.stringify(contentPackageDescriptionMessage))
            break
          case "configuration":
            socket.send(JSON.stringify(partChangeMessage))
            break
          case "newContentPart":
            socket.send(JSON.stringify(newPartMessage))
            break
          default:
            break
        }
      })
    })
  })

  afterEach(() =>
  {
    Server.clean()
  })

  test("should instanciate WSRecognizer", () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    expect(wsr).toBeDefined()
  })

  describe("Properties", () =>
  {
    test("should get url", () =>
    {
      const serverConfig = {
        ...DefaultServerConfiguration,
        scheme: "http",
        host: "pony",
        applicationKey: "applicationKey"
      } as TServerConfiguration
      const wsr = new WSRecognizer(serverConfig, DefaultRecognitionConfiguration)
      expect(wsr.url).toEqual("ws://pony/api/v4.0/iink/document?applicationKey=applicationKey")
    })
    recognitionTypeList.forEach(recognitionType =>
    {
      test(`should get mimeTypes for ${ recognitionType }`, () =>
      {
        const recognitionConfig: TRecognitionConfiguration = {
          ...DefaultRecognitionConfiguration,
          type: recognitionType
        }
        const wsr = new WSRecognizer(DefaultServerConfiguration, recognitionConfig)
        let mimeTypes: string[]
        switch (recognitionType) {
          case "TEXT":
            mimeTypes = recognitionConfig.text.mimeTypes
            break
          case "DIAGRAM":
            mimeTypes = recognitionConfig.diagram.mimeTypes
            break
          case "MATH":
            mimeTypes = recognitionConfig.math.mimeTypes
            break
          case "Raw Content":
            mimeTypes = []
            break
          default:
            throw new Error("invalid recognition type")
        }
        expect(wsr.mimeTypes).toEqual(mimeTypes)
      })
    })
  })

  describe("init", () =>
  {
    const serverConfigToCloseTest: TServerConfiguration = {
      ...DefaultServerConfiguration,
      host: "init-test"
    }
    let addStroMockServerForInitTest: Server
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance

    beforeEach(() =>
    {
      addStroMockServerForInitTest = new Server(`wss://${ serverConfigToCloseTest.host }/api/v4.0/iink/document`, {})
      wsr = new WSRecognizer(serverConfigToCloseTest, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
      spyEmitError.mockResolvedValue(() => Promise.resolve())
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      addStroMockServerForInitTest.close()
    })
    test("should sent newContentPackage message", async () =>
    {
      expect.assertions(2)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPackage")).toHaveLength(0)
      wsr.init(height, width)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPackage")).toHaveLength(1)
    })
    test("should sent hmac message when receive hmacChallenge message", async () =>
    {
      expect.assertions(2)
      wsr.init(height, width)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "hmac")).toHaveLength(0)
      addStroMockServerForInitTest.send(JSON.stringify(ackMessage))
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "hmac")).toHaveLength(1)
    })
    test("should sent hmac & newPart messages when receive hmacChallenge message", async () =>
    {
      expect.assertions(4)
      wsr.init(height, width)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "configuration")).toHaveLength(0)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPart")).toHaveLength(0)
      addStroMockServerForInitTest.send(JSON.stringify(contentPackageDescriptionMessage))
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "configuration")).toHaveLength(1)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPart")).toHaveLength(1)
    })
    test.skip("should resolve when receive newPart message", async () =>
    {
      expect.assertions(1)
      const promise = wsr.init(height, width)
      addStroMockServerForInitTest.send(JSON.stringify(newPartMessage))
      await promise
      expect(1).toEqual(1)
    })
    test.skip("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      const promise = wsr.init(height, width)
      addStroMockServerForInitTest.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("Ping", () =>
  {
    test("should send ping message", async () =>
    {
      expect.assertions(2)
      const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
      conf.websocket.pingDelay = 200
      const wsr = new WSRecognizer(conf, DefaultRecognitionConfiguration)
      await wsr.init(height, width)
      await delay(conf.websocket.pingDelay)
      await delay(100)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(1)
      await delay(conf.websocket.pingDelay)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(2)
    })
    test("should not send ping message", async () =>
    {
      expect.assertions(2)
      const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
      conf.websocket.pingDelay = 200
      conf.websocket.pingEnabled = false
      const wsr = new WSRecognizer(conf, DefaultRecognitionConfiguration)
      await wsr.init(height, width)
      await delay(conf.websocket.pingDelay)
      await delay(100)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(0)
      await delay(conf.websocket.pingDelay)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(0)
    })
  })

  describe("send", () =>
  {
    let wsr: WSRecognizer
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      const testDataToSend = { type: "test", data: "test-data" }
      await expect(wsr.send(testDataToSend)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const testDataToSend = { type: "test", data: "test-data" }
      await wsr.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      expect(messageSent).toEqual(testDataToSend)
    })
    //TODO fix test
    test.skip("should reconnect before send message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      await wsr.close(1000, "CLOSE_RECOGNIZER")
      const testDataToSend = { type: "test", data: "test-data" }
      await wsr.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      expect(messageSent).toEqual(testDataToSend)
    })
  })

  describe("addStrokes", () =>
  {
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      await expect(wsr.addStrokes(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send addStrokes message", async () =>
    {
      expect.assertions(1)
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      await wsr.init(height, width)
      wsr.addStrokes(model)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const addStrokesMessageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      const addStrokesMessageSentToTest = {
        type: "addStrokes",
        strokes: [{
          "p": [0.88, 0.07],
          "pointerType": "pen",
          "t": [1, 10],
          "x": [1, 100],
          "y": [1, 1],
        }]
      }
      await expect(addStrokesMessageSent).toMatchObject(addStrokesMessageSentToTest)
    })
    test("should not send addStrokes message if model.extractUnsentStrokes return 0 strokes", async () =>
    {
      expect.assertions(1)
      const emptyModel: IModel = new Model(width, height)
      await wsr.init(height, width)
      await wsr.addStrokes(emptyModel)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const addStrokesMessageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      await expect(addStrokesMessageSent.type).not.toEqual("addStrokes")
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      await wsr.init(height, width)
      const promise = wsr.addStrokes(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(emptyExportedMessage))
      await promise
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          exports: {
            "application/vnd.myscript.jiix": emptyJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      await wsr.init(height, width)
      const promise = wsr.addStrokes(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("Style", () =>
  {
    let wsr: WSRecognizer
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should setPenStyle", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const CustomPenStyle: TPenStyle = { color: "#d1d1d1" }
      await wsr.setPenStyle(CustomPenStyle)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const setPenStyle = mockServer.messages[mockServer.messages.length - 1]
      const setPenStyleToTest = JSON.stringify({
        type: "setPenStyle",
        style: "color: #d1d1d1;"
      })
      expect(setPenStyle).toContain(setPenStyleToTest)
    })
    test("should setPenStyleClasses", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const styleClasses = "pony"
      await wsr.setPenStyleClasses(styleClasses)
      await delay(100)
      //¯\_(ツ)_/¯  required to wait server received message
      const setPenStyleClasses = mockServer.messages[mockServer.messages.length - 1]
      const setPenStyleClassesToTest = JSON.stringify({
        type: "setPenStyleClasses",
        styleClasses
      })
      expect(setPenStyleClasses).toContain(setPenStyleClassesToTest)
    })
    test("should setTheme", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const theme: TTheme = {
        ink: {
          width: 42,
          color: "#2E7D32",
          "-myscript-pen-width": 2,
          "-myscript-pen-fill-style": "purple",
          "-myscript-pen-fill-color": "#FFFFFF00"
        },
        ".math": {
          "font-family": "STIXGeneral"
        },
        ".math-solved": {
          "font-family": "STIXGeneral",
          color: "blue"
        },
        ".text": {
          "font-family": "Rubik Distressed",
          "font-size": 10
        }
      }
      await wsr.setTheme(theme)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)

      const setThemeMessageSent = mockServer.messages[mockServer.messages.length - 1]
      const setThemeMessageSentToTest = "{\"type\":\"setTheme\",\"theme\":\"ink {\\nwidth: 42;\\ncolor: #2E7D32;\\n-myscript-pen-width: 2;\\n-myscript-pen-fill-style: purple;\\n-myscript-pen-fill-color: #FFFFFF00;\\n}\\n.math {\\nfont-family: STIXGeneral;\\n}\\n.math-solved {\\nfont-family: STIXGeneral;\\ncolor: blue;\\n}\\n.text {\\nfont-family: Rubik Distressed;\\nfont-size: 10;\\n}\\n\"}"
      expect(setThemeMessageSent).toContain(setThemeMessageSentToTest)
    })
  })

  describe("export", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.export(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    recognitionTypeList.forEach((recognitionType: TRecognitionType) =>
    {
      test(`should send export message for ${ recognitionType }`, async () =>
      {
        expect.assertions(1)
        const recognitionConfig: TRecognitionConfiguration = {
          ...DefaultRecognitionConfiguration,
          type: recognitionType
        }
        const my_wsr = new WSRecognizer(DefaultServerConfiguration, recognitionConfig)
        await my_wsr.init(height, width)
        my_wsr.export(model)
        //¯\_(ツ)_/¯  required to wait server received message
        await delay(100)
        const exportMessageSent = mockServer.messages[mockServer.messages.length - 1]
        let mimeTypes: string[]
        switch (recognitionType) {
          case "TEXT":
            mimeTypes = DefaultRecognitionConfiguration.text.mimeTypes
            break
          case "DIAGRAM":
            mimeTypes = DefaultRecognitionConfiguration.diagram.mimeTypes
            break
          case "MATH":
            mimeTypes = DefaultRecognitionConfiguration.math.mimeTypes
            break
          case "Raw Content":
            mimeTypes = ["application/vnd.myscript.jiix"]
            break
          default:
            throw new Error("invalid recognition type")
        }

        const exportMessageSentToTest = JSON.stringify({
          type: "export",
          partId: partChangeMessage.partId,
          mimeTypes
        })
        expect(exportMessageSent).toContain(exportMessageSentToTest)
        my_wsr.destroy()
      })
    })
    test("should resolve when receive fileChunckAck message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.export(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(hExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          exports: {
            "application/vnd.myscript.jiix": hJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.export(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("import", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    const mimeType = "text/plain"
    const textImport = "winter is comming"
    const blobToImport = new Blob([textImport])
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      await expect(wsr.import(model, blobToImport, mimeType)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send import message", async () =>
    {
      await wsr.init(height, width)
      wsr.import(model, blobToImport, mimeType)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) =>
      {
        return JSON.parse(m as string) as TWebSocketEvent
      })
      await expect(parsedMessage.filter(m => m.type === "importFile")).toHaveLength(1)
      await expect(parsedMessage.filter(m => m.type === "importFile")[0]).toEqual(
        expect.objectContaining({
          type: "importFile",
          mimeType
        })
      )
      await expect(parsedMessage.filter(m => m.type === "fileChunk")).toHaveLength(1)
      await expect(parsedMessage.filter(m => m.type === "fileChunk")[0]).toEqual(
        expect.objectContaining({
          type: "fileChunk",
          data: textImport
        })
      )
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.import(model, blobToImport, mimeType)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(emptyExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          exports: {
            "application/vnd.myscript.jiix": emptyJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.import(model, blobToImport, mimeType)
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("resize", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.resize(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send resize message", async () =>
    {
      expect.assertions(1)
      model.height = 27
      model.width = 5
      await wsr.init(height, width)
      wsr.resize(model)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
      const resizeMessageSentToTest = JSON.stringify({ type: "changeViewSize", height: model.height, width: model.width })
      await expect(resizeMessageSent).toEqual(resizeMessageSentToTest)
    })
    test("should resolve when receive svg patch message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.resize(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(svgPatchMessage))
      await expect(promise).resolves.toEqual(model)
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.resize(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("convert", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.convert(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send convert message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const conversionState: TConverstionState = "DIGITAL_EDIT"
      wsr.convert(model, conversionState)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
      const resizeMessageSentToTest = JSON.stringify({ type: "convert", conversionState })
      await expect(resizeMessageSent).toEqual(resizeMessageSentToTest)
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.convert(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(emptyExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          converts: {
            "application/vnd.myscript.jiix": emptyJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.convert(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("undo", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.undo(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send undo message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      wsr.undo(model)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
      const resizeMessageSentToTest = JSON.stringify({ type: "undo" })
      await expect(resizeMessageSent).toEqual(resizeMessageSentToTest)
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.undo(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(emptyExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          exports: {
            "application/vnd.myscript.jiix": emptyJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.undo(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("redo", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.redo(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send redo message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      wsr.redo(model)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
      const resizeMessageSentToTest = JSON.stringify({ type: "redo" })
      await expect(resizeMessageSent).toEqual(resizeMessageSentToTest)
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.redo(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(emptyExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          exports: {
            "application/vnd.myscript.jiix": emptyJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.redo(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("clear", () =>
  {
    const model: IModel = new Model(width, height)
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.clear(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send clear message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      wsr.clear(model)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
      const resizeMessageSentToTest = JSON.stringify({ type: "clear" })
      await expect(resizeMessageSent).toEqual(resizeMessageSentToTest)
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.clear(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(emptyExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          exports: {
            "application/vnd.myscript.jiix": emptyJIIX
          }
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.clear(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(new Error(Constants.Error.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(Constants.Error.WRONG_CREDENTIALS))
    })
  })

  describe("Connection lost", () =>
  {
    const serverConfigToCloseTest: TServerConfiguration = {
      ...DefaultServerConfiguration,
      host: "close-test"
    }
    let mockServerForCloseTest: Server
    let wsr: WSRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(() =>
    {
      mockServerForCloseTest = new Server(`wss://${ serverConfigToCloseTest.host }/api/v4.0/iink/document`, {})
      mockServerForCloseTest.on("connection", (socket) =>
      {
        socket.on("message", (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
        {
          const parsedMessage: TWebSocketEvent = JSON.parse(message as string)
          switch (parsedMessage.type) {
            case "newContentPackage":
              socket.send(JSON.stringify(ackMessage))
              break
            case "hmac":
              socket.send(JSON.stringify(contentPackageDescriptionMessage))
              break
            case "configuration":
              socket.send(JSON.stringify(partChangeMessage))
              break
            case "newContentPart":
              socket.send(JSON.stringify(newPartMessage))
              break
            default:
              break
          }
        })
      })
      wsr = new WSRecognizer(serverConfigToCloseTest, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      spyEmitError.mockReset()
      await wsr.destroy()
    })
    const closeMessageOptions = [
      { code: 1001, message: Constants.Error.GOING_AWAY },
      { code: 1002, message: Constants.Error.PROTOCOL_ERROR },
      { code: 1003, message: Constants.Error.UNSUPPORTED_DATA },
      { code: 1006, message: Constants.Error.ABNORMAL_CLOSURE },
      { code: 1007, message: Constants.Error.INVALID_FRAME_PAULOAD },
      { code: 1008, message: Constants.Error.POLICY_VIOLATION },
      { code: 1009, message: Constants.Error.MESSAGE_TOO_BIG },
      { code: 1011, message: Constants.Error.INTERNAL_ERROR },
      { code: 1012, message: Constants.Error.SERVICE_RESTART },
      { code: 1013, message: Constants.Error.TRY_AGAIN },
      { code: 1014, message: Constants.Error.BAD_GATEWAY },
      { code: 1015, message: Constants.Error.TLS_HANDSHAKE },
      { code: 42, message: Constants.Error.CANT_ESTABLISH },
    ]
    closeMessageOptions.forEach(async (closeEvent) =>
    {
      test(`should emit error if the server closes the connection abnormally code == ${ closeEvent.code }`, async () =>
      {
        expect.assertions(2)
        await wsr.init(height, width)
        mockServerForCloseTest.server.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: false })
        expect(spyEmitError).toHaveBeenCalledTimes(1)
        expect(spyEmitError).toHaveBeenCalledWith(new Error(closeEvent.message))
      })
    })
  })

  describe("destroy", () =>
  {
    test("should close socket", async () =>
    {
      expect.assertions(2)
      const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      await wsr.init(height, width)
      // 1 -> OPEN
      await expect(mockServer.server.clients()[0].readyState).toEqual(1)
      wsr.destroy()
      // 2 -> CLOSING
      await expect(mockServer.server.clients()[0].readyState).toEqual(2)
    })
  })
})
