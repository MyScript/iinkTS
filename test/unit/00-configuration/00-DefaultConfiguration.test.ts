import { configuration } from "../../../src/iink"

describe("DefaultConfiguration.ts", () =>
{
  const { DefaultConfiguration } = configuration
  describe("should have DefaultServerConfiguration", () =>
  {
    test("should have protocol", () =>
    {
      expect(DefaultConfiguration.server.protocol).toStrictEqual("WEBSOCKET")
    })
    test("should have scheme", () =>
    {
      expect(DefaultConfiguration.server.scheme).toStrictEqual("https")
    })
    test("should have host", () =>
    {
      expect(DefaultConfiguration.server.host).toStrictEqual("cloud.myscript.com")
    })
    test("should not have applicationKey", () =>
    {
      expect(DefaultConfiguration.server.applicationKey).toStrictEqual("")
    })
    test("should not have hmacKey", () =>
    {
      expect(DefaultConfiguration.server.hmacKey).toStrictEqual("")
    })
    test("should not useWindowLocation", () =>
    {
      expect(DefaultConfiguration.server.useWindowLocation).toStrictEqual(false)
    })
  })

  describe("should have DefaultRecognitionConfiguration", () =>
  {
    test("should have type", () =>
    {
      expect(DefaultConfiguration.recognition.type).toStrictEqual("TEXT")
    })
    test("should have lang", () =>
    {
      expect(DefaultConfiguration.recognition.lang).toStrictEqual("en_US")
    })
    test("should have gesture", () =>
    {
      expect(DefaultConfiguration.recognition.gesture.enable).toStrictEqual(true)
    })
    test("should have renderer", () =>
    {
      expect(DefaultConfiguration.recognition.renderer.debug["draw-image-boxes"]).toStrictEqual(false)
      expect(DefaultConfiguration.recognition.renderer.debug["draw-image-boxes"]).toStrictEqual(false)
    })
    test("should have math", () =>
    {
      expect(DefaultConfiguration.recognition.math.mimeTypes).toStrictEqual(["application/vnd.myscript.jiix"])
      expect(DefaultConfiguration.recognition.math.solver?.enable).toStrictEqual(true)
      expect(DefaultConfiguration.recognition.math.eraser?.["erase-precisely"]).toStrictEqual(false)
      expect(DefaultConfiguration.recognition.math["undo-redo"]?.mode).toStrictEqual("stroke")
    })
    test("should have text", () =>
    {
      expect(DefaultConfiguration.recognition.text.guides?.enable).toStrictEqual(true)
      expect(DefaultConfiguration.recognition.text.mimeTypes).toStrictEqual(["application/vnd.myscript.jiix"])
      expect(DefaultConfiguration.recognition.text.eraser?.["erase-precisely"]).toStrictEqual(false)
    })
    test("should have diagram", () =>
    {
      expect(DefaultConfiguration.recognition.diagram.mimeTypes).toStrictEqual(["application/vnd.myscript.jiix"])
      expect(DefaultConfiguration.recognition.diagram.eraser?.["erase-precisely"]).toStrictEqual(false)
    })
    test("should have raw-content", () =>
    {
      expect(DefaultConfiguration.recognition["raw-content"]).not.toHaveProperty("mimeTypes")
      expect(DefaultConfiguration.recognition["raw-content"].recognition?.text).toStrictEqual(true)
      expect(DefaultConfiguration.recognition["raw-content"].recognition?.shape).toStrictEqual(true)
      expect(DefaultConfiguration.recognition["raw-content"].eraser?.["erase-precisely"]).toStrictEqual(false)
    })
  })

  describe("should have DefaultGrabberConfiguration", () =>
  {
    test("should have listenerOptions", () =>
    {
      expect(DefaultConfiguration.grabber.listenerOptions.capture).toStrictEqual(false)
      expect(DefaultConfiguration.grabber.listenerOptions.passive).toStrictEqual(true)
    })
    test("should have xyFloatPrecision", () =>
    {
      expect(DefaultConfiguration.grabber.xyFloatPrecision).toStrictEqual(0)
    })
    test("should have timestampFloatPrecision", () =>
    {
      expect(DefaultConfiguration.grabber.timestampFloatPrecision).toStrictEqual(0)
    })
  })

  describe("should have DefaultRenderingConfiguration", () =>
  {
    test("should have minHeight", () =>
    {
      expect(DefaultConfiguration.rendering.minHeight).toStrictEqual(100)
    })
    test("should have minWidth", () =>
    {
      expect(DefaultConfiguration.rendering.minWidth).toStrictEqual(100)
    })
    test("should have smartGuide", () =>
    {
      expect(DefaultConfiguration.rendering.smartGuide.enable).toStrictEqual(true)
      expect(DefaultConfiguration.rendering.smartGuide.fadeOut.enable).toStrictEqual(false)
      expect(DefaultConfiguration.rendering.smartGuide.fadeOut.duration).toStrictEqual(5000)
    })
  })

  describe("should have DefaultTriggerConfiguration", () =>
  {
    test("should have exportContent", () =>
    {
      expect(DefaultConfiguration.triggers.exportContent).toStrictEqual("POINTER_UP")
    })
    test("should have exportContentDelay", () =>
    {
      expect(DefaultConfiguration.triggers.exportContentDelay).toStrictEqual(1000)
    })
    test("should have resizeTriggerDelay", () =>
    {
      expect(DefaultConfiguration.triggers.resizeTriggerDelay).toStrictEqual(100)
    })
  })

  describe("should have DefaultEventsConfiguration", () =>
  {
    test("should have processDelay", () =>
    {
      expect(DefaultConfiguration.events.processDelay).toStrictEqual(10)
    })
  })

  describe("should have DefaultUndoRedoConfiguration", () =>
  {
    test("should have maxStackSize", () =>
    {
      expect(DefaultConfiguration["undo-redo"].maxStackSize).toStrictEqual(100)
    })
  })
})
