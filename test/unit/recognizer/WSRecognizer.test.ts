import { ConfigurationMathWebsocket, ConfigurationTextWebsocket } from "../__dataset__/configuration.dataset"
import { ServerWebsocketMock, emptyJIIX, errorNotGrantedMessage, hJIIX, partChangeMessage } from "../__mocks__/ServerWebsocketMock"
import { buildStroke, delay } from "../helpers"


import
{
  TServerConfiguration,
  TRecognitionConfiguration,
  WSRecognizer,
  DefaultRecognitionConfiguration,
  RecognizerError,
  TRecognitionType,
  TConfiguration,
  TPenStyle,
  TTheme,
  Model,
  TConverstionState,
} from "../../../src/iink"

describe("WSRecognizer.ts", () =>
{
  const height = 100, width = 100

  const testDatas: { type: TRecognitionType, config: TConfiguration }[] = [
    {
      type: "TEXT",
      config: ConfigurationTextWebsocket as TConfiguration
    },
    {
      type: "MATH",
      config: ConfigurationMathWebsocket as TConfiguration
    },
  ]

  test("should instanciate WSRecognizer", () =>
  {
    const wsr = new WSRecognizer(ConfigurationTextWebsocket.server as TServerConfiguration, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)
    expect(wsr).toBeDefined()
  })

  describe("Properties", () =>
  {
    test("should get url", () =>
    {
      const serverConfig = {
        ...ConfigurationTextWebsocket.server,
        scheme: "http",
        host: "pony",
        applicationKey: "applicationKey"
      } as TServerConfiguration

      const wsr = new WSRecognizer(serverConfig, DefaultRecognitionConfiguration)
      expect(wsr.url).toEqual("ws://pony/api/v4.0/iink/document?applicationKey=applicationKey")
    })

    testDatas.forEach(({ type, config }) =>
    {
      test(`should get mimeTypes for ${ type }`, () =>
      {
        const wsr = new WSRecognizer(config.server, config.recognition)
        switch (type) {
          case "TEXT":
            expect(wsr.mimeTypes).toEqual(config.recognition.text.mimeTypes)
            break
          case "MATH":
            expect(wsr.mimeTypes).toEqual(config.recognition.math.mimeTypes)
            break
        }
      })
    })
  })

  describe("init", () =>
  {
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "init-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer


    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)
      mockServer = new ServerWebsocketMock(wsr.url)
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
    })

    test("should sent newContentPackage message", async () =>
    {
      expect.assertions(2)
      expect(mockServer.getMessages("newContentPackage")).toHaveLength(0)
      wsr.init(height, width)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("newContentPackage")).toHaveLength(1)
    })
    test("should sent hmac and configuration messages when receive ack message with hmacChallenge", async () =>
    {
      expect.assertions(3)
      expect(mockServer.messages).toHaveLength(0)
      wsr.init(height, width)
      mockServer.sendAckWithHMAC()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("hmac")).toHaveLength(1)
      expect(mockServer.getMessages("configuration")).toHaveLength(1)
    })
    test("should sent only configuration message when receive ack message without hmacChallenge", async () =>
    {
      expect.assertions(3)
      expect(mockServer.messages).toHaveLength(0)
      wsr.init(height, width)

      mockServer.sendAckWithoutHMAC()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("hmac")).toHaveLength(0)
      expect(mockServer.getMessages("configuration")).toHaveLength(1)
    })
    test("should sent newContentPart message when receive contentPackageDescription", async () =>
    {
      expect.assertions(2)
      wsr.init(height, width)
      expect(mockServer.getMessages("newContentPart")).toHaveLength(0)
      mockServer.sendAckWithoutHMAC()
      mockServer.sendContentPackageDescription()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("newContentPart")).toHaveLength(1)
    })
    test("should sent openContentPart message when receive contentPackageDescription if currentPartId is defined", async () =>
    {
      expect.assertions(2)
      wsr.init(height, width)
      expect(mockServer.getMessages("openContentPart")).toHaveLength(0)
      wsr.currentPartId = "currentPartId"
      mockServer.sendAckWithoutHMAC()
      mockServer.sendContentPackageDescription()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("openContentPart")).toHaveLength(1)
    })
    test("should resolve when receive newPart message", async () =>
    {
      expect.assertions(1)
      const promise = wsr.init(height, width)
      mockServer.sendAckWithoutHMAC()
      mockServer.sendContentPackageDescription()
      mockServer.sendNewPartMessage()
      await promise
      expect(1).toEqual(1)
    })
    //fix test
    //maybe refactor of internal event to remove singleton
    test.skip("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      const promise = wsr.init(height, width)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("Ping", () =>
  {
    const serverConfig = {
      ...JSON.parse(JSON.stringify(ConfigurationTextWebsocket.server)),
      host: "ping-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
    })

    test("should send ping message", async () =>
    {
      expect.assertions(2)
      serverConfig.websocket.pingEnabled = true
      const wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)
      await wsr.init(height, width)
      await delay(serverConfig.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(1)
      await delay(serverConfig.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(2)
      await wsr.destroy()
    })
    test("should not send ping message", async () =>
    {
      expect.assertions(2)
      serverConfig.websocket.pingEnabled = false
      const wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)
      await wsr.init(height, width)
      await delay(serverConfig.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await delay(serverConfig.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await wsr.destroy()
    })
    test("should close the connection when maxPingLostCount is reached", async () =>
    {
      expect.assertions(3)
      serverConfig.websocket.pingEnabled = true
      serverConfig.websocket.maxPingLostCount = 2
      const wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)
      await wsr.init(height, width)
      await delay(serverConfig.websocket.pingDelay * 1.5)
      expect(mockServer.server.clients()).toHaveLength(1)
      await delay(serverConfig.websocket.pingDelay * serverConfig.websocket.maxPingLostCount)
      expect(mockServer.getMessages("ping")).toHaveLength(serverConfig.websocket.maxPingLostCount + 1)
      expect(mockServer.server.clients()).toHaveLength(0)
      await wsr.destroy()
    })
  })

  describe("send", () =>
  {
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "send-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
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
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual(testDataToSend)
    })
  })

  describe("addStrokes", () =>
  {
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "add-strokes-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
    })

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      const stroke = buildStroke()
      await expect(wsr.addStrokes([stroke])).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send addStrokes message", async () =>
    {
      expect.assertions(1)
      const stroke = buildStroke()
      await wsr.init(height, width)
      wsr.addStrokes([stroke])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const addStrokesMessageSent = JSON.parse(mockServer.getLastMessage() as string)
      const addStrokesMessageSentToTest = {
        type: "addStrokes",
        strokes: [stroke.formatToSend()]
      }
      await expect(addStrokesMessageSent).toMatchObject(addStrokesMessageSentToTest)
    })
    test("should not send addStrokes message if model.extractUnsentStrokes return 0 strokes", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      await wsr.addStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const addStrokesMessageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(addStrokesMessageSent.type).not.toEqual("addStrokes")
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      const stroke = buildStroke()
      await wsr.init(height, width)
      const promise = wsr.addStrokes([stroke])
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendEmptyExportMessage()
      await promise
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": emptyJIIX
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      let spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      const stroke = buildStroke()
      await wsr.init(height, width)
      const promise = wsr.addStrokes([stroke])
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorNotGrantedMessage))
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("Style", () =>
  {
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "style-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
    })

    test("should setPenStyle", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const CustomPenStyle: TPenStyle = { color: "#d1d1d1" }
      await wsr.setPenStyle(CustomPenStyle)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const setPenStyle = mockServer.getLastMessage()
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
      const setPenStyleClasses = mockServer.getLastMessage()
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

      const setThemeMessageSent = mockServer.getLastMessage()
      const setThemeMessageSentToTest = "{\"type\":\"setTheme\",\"theme\":\"ink {\\nwidth: 42;\\ncolor: #2E7D32;\\n-myscript-pen-width: 2;\\n-myscript-pen-fill-style: purple;\\n-myscript-pen-fill-color: #FFFFFF00;\\n}\\n.math {\\nfont-family: STIXGeneral;\\n}\\n.math-solved {\\nfont-family: STIXGeneral;\\ncolor: blue;\\n}\\n.text {\\nfont-family: Rubik Distressed;\\nfont-size: 10;\\n}\\n\"}"
      expect(setThemeMessageSent).toContain(setThemeMessageSentToTest)
    })
  })

  describe("export", () =>
  {
    const model = new Model(width, height)
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "export-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
    })

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.export(model)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    testDatas.forEach(({ type, config }) =>
    {
      test(`should send export message for ${ type }`, async () =>
      {
        expect.assertions(1)
        const recognitionConfig: TRecognitionConfiguration = {
          ...config.recognition,
          type
        }
        const my_wsr = new WSRecognizer(serverConfig, recognitionConfig)
        await my_wsr.init(height, width)
        my_wsr.export(model)
        //¯\_(ツ)_/¯  required to wait server received message
        await delay(100)
        const exportMessageSent = mockServer.getLastMessage()
        let mimeTypes: string[]
        switch (type) {
          case "TEXT":
            mimeTypes = config.recognition.text.mimeTypes
            break
          case "MATH":
            mimeTypes = config.recognition.math.mimeTypes
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
    test("should resolve when receive export message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.export(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendHExportMessage()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.export(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorNotGrantedMessage))
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("import", () =>
  {
    const model = new Model(width, height)
    const mimeType = "text/plain"
    const textImport = "winter is comming"
    const blobToImport = new Blob([textImport])
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "import-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const importFileMessages = mockServer.getMessages("importFile")
      expect(importFileMessages).toHaveLength(1)
      //@ts-ignore
      const importFileMes = JSON.parse(importFileMessages[0])
      //@ts-ignore
      expect(importFileMes.mimeType).toEqual(mimeType)

      const fileChunkMessages = mockServer.getMessages("fileChunk")
      expect(fileChunkMessages).toHaveLength(1)
      //@ts-ignore
      const fileChunkMes = JSON.parse(fileChunkMessages[0])
      //@ts-ignore
      expect(fileChunkMes.importFileId).toEqual(importFileMes.importFileId)
    })
    test("should resolve when receive exported message", async () =>
    {
      expect.assertions(1)
      await wsr.init(height, width)
      const promise = wsr.import(model, blobToImport, mimeType)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendEmptyExportMessage()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.import(model, blobToImport, mimeType)
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("resize", () =>
  {
    const model = new Model(width, height)
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "resize-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const resizeMessageSent = mockServer.getLastMessage()
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
      mockServer.sendSVGPatchMessage()
      await expect(promise).resolves.toEqual(model)
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.resize(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("convert", () =>
  {
    const model = new Model(width, height)
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "convert-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const resizeMessageSent = mockServer.getLastMessage()
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
      mockServer.sendEmptyExportMessage()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.convert(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("undo", () =>
  {
    const model = new Model(width, height)
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "undo-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const resizeMessageSent = mockServer.getLastMessage()
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
      mockServer.sendEmptyExportMessage()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.undo(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("redo", () =>
  {
    const model = new Model(width, height)
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "undo-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, ConfigurationTextWebsocket.recognition as TRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const resizeMessageSent = mockServer.getLastMessage()
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
      mockServer.sendEmptyExportMessage()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.redo(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("clear", () =>
  {
    const model = new Model(width, height)
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "clear-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, DefaultRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
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
      const resizeMessageSent = mockServer.getLastMessage()
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
      mockServer.sendEmptyExportMessage()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
      expect.assertions(3)
      await wsr.init(height, width)
      const promise = wsr.clear(model)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(new Error(RecognizerError.WRONG_CREDENTIALS))
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("Connection lost", () =>
  {
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "close-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    let wsr: WSRecognizer

    beforeEach(() =>
    {
      wsr = new WSRecognizer(serverConfig, DefaultRecognitionConfiguration)

      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      mockServer.close()
    })


    const closeMessageOptions = [
      { code: 1001, message: RecognizerError.GOING_AWAY },
      { code: 1002, message: RecognizerError.PROTOCOL_ERROR },
      { code: 1003, message: RecognizerError.UNSUPPORTED_DATA },
      { code: 1006, message: RecognizerError.ABNORMAL_CLOSURE },
      { code: 1007, message: RecognizerError.INVALID_FRAME_PAULOAD },
      { code: 1008, message: RecognizerError.POLICY_VIOLATION },
      { code: 1009, message: RecognizerError.MESSAGE_TOO_BIG },
      { code: 1011, message: RecognizerError.INTERNAL_ERROR },
      { code: 1012, message: RecognizerError.SERVICE_RESTART },
      { code: 1013, message: RecognizerError.TRY_AGAIN },
      { code: 1014, message: RecognizerError.BAD_GATEWAY },
      { code: 1015, message: RecognizerError.TLS_HANDSHAKE },
      { code: 42, message: RecognizerError.CANT_ESTABLISH },
    ]
    closeMessageOptions.forEach(async (closeEvent) =>
    {
      test(`should emit error if the server closes the connection abnormally code == ${ closeEvent.code }`, async () =>
      {
        const spyEmitError: jest.SpyInstance = jest.spyOn(wsr.internalEvent, "emitError")
        expect.assertions(2)
        await wsr.init(height, width)
        mockServer.server.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: false })
        expect(spyEmitError).toHaveBeenCalledTimes(1)
        expect(spyEmitError).toHaveBeenCalledWith(new Error(closeEvent.message))
      })
    })
  })

  describe("destroy", () =>
  {
    const serverConfig = {
      ...ConfigurationTextWebsocket.server,
      host: "destroy-test"
    } as TServerConfiguration
    let mockServer: ServerWebsocketMock
    test("should close socket", async () =>
    {
      expect.assertions(2)
      const wsr = new WSRecognizer(serverConfig, DefaultRecognitionConfiguration)
      mockServer = new ServerWebsocketMock(wsr.url)
      mockServer.init()

      await wsr.init(height, width)
      // 1 -> OPEN
      await expect(mockServer.server.clients()[0].readyState).toEqual(1)
      wsr.destroy()
      // 2 -> CLOSING
      await expect(mockServer.server.clients()[0].readyState).toEqual(2)
      mockServer.close()
    })
  })
})
