import { WebSocketSSRClientConfiguration } from "@/iink"

describe("WebSocketSSRClientConfiguration.ts", () => {
  test("should build the default configuration when given nothing", () => {
    const conf = new WebSocketSSRClientConfiguration()

    expect(conf.recognition.type).toEqual("TEXT")
    expect(conf.recognition.lang).toEqual("en_US")
    expect(conf.recognition.convert).toBeUndefined()
    expect(conf.recognition.export.jiix.text.lines).toEqual(false)
  })

  test("should merge a partial configuration onto the defaults", () => {
    const conf = new WebSocketSSRClientConfiguration({ recognition: { lang: "fr_FR" } })

    expect(conf.recognition.lang).toEqual("fr_FR")
    expect(conf.recognition.type).toEqual("TEXT")
  })

  test("should dedupe mimeTypes overrides for text/math", () => {
    const conf = new WebSocketSSRClientConfiguration({
      recognition: {
        text: { mimeTypes: ["text/plain", "text/plain"] },
        math: { mimeTypes: ["application/x-latex", "application/x-latex"] },
      },
    })

    expect(conf.recognition.text.mimeTypes).toEqual(["text/plain"])
    expect(conf.recognition.math.mimeTypes).toEqual(["application/x-latex"])
  })

  test("should not apply any version gate when server.version is not set", () => {
    const conf = new WebSocketSSRClientConfiguration({
      recognition: { convert: { force: { "on-stylesheet-change": true } } },
    })

    expect(conf.recognition.convert).toBeDefined()
    expect(conf.recognition.export.jiix.text.lines).toEqual(false)
  })

  test("should strip convert and jiix.text.lines when the server is below the gated versions", () => {
    const conf = new WebSocketSSRClientConfiguration({
      server: { version: "2.0.0" },
      recognition: { convert: { force: { "on-stylesheet-change": true } } },
    })

    expect(conf.recognition.convert).toBeUndefined()
    expect(conf.recognition.export.jiix.text.lines).toBeUndefined()
  })

  test("should keep convert but strip jiix.text.lines between the two gated versions", () => {
    const conf = new WebSocketSSRClientConfiguration({
      server: { version: "2.3.0" },
      recognition: { convert: { force: { "on-stylesheet-change": true } } },
    })

    expect(conf.recognition.convert).toBeDefined()
    expect(conf.recognition.export.jiix.text.lines).toBeUndefined()
  })

  test("should keep both convert and jiix.text.lines when the server is above both gates", () => {
    const conf = new WebSocketSSRClientConfiguration({
      server: { version: "3.2.0" },
      recognition: { convert: { force: { "on-stylesheet-change": true } } },
    })

    expect(conf.recognition.convert).toBeDefined()
    expect(conf.recognition.export.jiix.text.lines).toEqual(false)
  })
})
