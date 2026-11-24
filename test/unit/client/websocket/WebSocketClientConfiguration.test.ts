import { WebSocketClientConfiguration } from "@/iink"

describe("WebSocketClientConfiguration.ts", () => {
  test("should build the default configuration when given nothing", () => {
    const conf = new WebSocketClientConfiguration()

    expect(conf.recognition.export.jiix["full-stroke-ids"]).toEqual(true)
    expect(conf.recognition.export.jiix.ids).toEqual(true)
    expect(conf.recognition.export.jiix.text.words).toEqual(true)
    expect(conf.recognition.export.jiix.text.chars).toEqual(true)
    expect(conf.recognition.export.jiix.text.lines).toEqual(true)
    expect(conf.recognition.export.jiix["bounding-box"]).toEqual(true)
  })

  test("should force the jiix export flags to true even when the caller passes false", () => {
    const conf = new WebSocketClientConfiguration({
      recognition: { export: { jiix: { ids: false, "full-stroke-ids": false, text: { words: false } } } },
    })

    expect(conf.recognition.export.jiix.ids).toEqual(true)
    expect(conf.recognition.export.jiix["full-stroke-ids"]).toEqual(true)
    expect(conf.recognition.export.jiix.text.words).toEqual(true)
  })

  test("should apply raw-content recognition/classification/gestures overrides", () => {
    const conf = new WebSocketClientConfiguration({
      recognition: {
        "raw-content": {
          recognition: { types: ["text"] },
          classification: { types: ["shape"] },
          gestures: ["surround"],
        },
      },
    })

    expect(conf.recognition["raw-content"].recognition!.types).toEqual(["text"])
    expect(conf.recognition["raw-content"].classification!.types).toEqual(["shape"])
    expect(conf.recognition["raw-content"].gestures).toEqual(["surround"])
  })

  test("should not apply the version gate when server.version is not set", () => {
    const conf = new WebSocketClientConfiguration()

    expect(conf.recognition.export.jiix.text.lines).toEqual(true)
    expect(conf.recognition["raw-content"].classification).toBeDefined()
  })

  test("should strip jiix.text.lines and raw-content.classification when the server is below 3.2.0", () => {
    const conf = new WebSocketClientConfiguration({ server: { version: "3.0.0" } })

    expect(conf.recognition.export.jiix.text.lines).toBeUndefined()
    expect(conf.recognition["raw-content"].classification).toBeUndefined()
  })

  test("should keep jiix.text.lines and raw-content.classification when the server is at or above 3.2.0", () => {
    const conf = new WebSocketClientConfiguration({ server: { version: "3.2.0" } })

    expect(conf.recognition.export.jiix.text.lines).toEqual(true)
    expect(conf.recognition["raw-content"].classification).toBeDefined()
  })
})
