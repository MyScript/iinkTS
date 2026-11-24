import { redactServerSecrets, serverUrl } from "@/iink"

describe("redactServerSecrets", () => {
  test("should redact hmacKey and applicationKey", () => {
    const config = {
      server: {
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: "YYYY-YYYY-YYYY",
      },
    }
    expect(redactServerSecrets(config)).toEqual({
      server: {
        host: "cloud.myscript.com",
        applicationKey: "[REDACTED]",
        hmacKey: "[REDACTED]",
      },
    })
  })

  test("should redact a function hmacKey the same way as a string one", () => {
    const config = {
      server: {
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: () => Promise.resolve("computed"),
      },
    }
    expect(redactServerSecrets(config)).toEqual({
      server: {
        host: "cloud.myscript.com",
        applicationKey: "[REDACTED]",
        hmacKey: "[REDACTED]",
      },
    })
  })

  test("should not touch the original config object", () => {
    const config = { server: { hmacKey: "YYYY-YYYY-YYYY" } }
    redactServerSecrets(config)
    expect(config.server.hmacKey).toEqual("YYYY-YYYY-YYYY")
  })

  test("should leave non-object input untouched", () => {
    expect(redactServerSecrets(undefined)).toEqual(undefined)
    expect(redactServerSecrets({})).toEqual({})
  })
})

describe("serverUrl", () => {
  const server = { scheme: "https" as const, host: "cloud.myscript.com" }

  test("should build an HTTP endpoint URL", () => {
    expect(serverUrl(server, "recognize")).toBe("https://cloud.myscript.com/api/v4.0/iink/recognize")
  })

  test("should keep the scheme of a plain http server", () => {
    expect(serverUrl({ ...server, scheme: "http" }, "version")).toBe("http://cloud.myscript.com/api/v4.0/iink/version")
  })

  test("should turn https into wss, and http into ws, for a websocket", () => {
    expect(serverUrl(server, "offscreen", { websocket: true })).toBe("wss://cloud.myscript.com/api/v4.0/iink/offscreen")
    expect(serverUrl({ ...server, scheme: "http" }, "document", { websocket: true })).toBe(
      "ws://cloud.myscript.com/api/v4.0/iink/document"
    )
  })

  test("should encode the query values", () => {
    expect(serverUrl(server, "offscreen", { websocket: true, query: { applicationKey: "a&b=c" } })).toBe(
      "wss://cloud.myscript.com/api/v4.0/iink/offscreen?applicationKey=a%26b%3Dc"
    )
  })
})
