import fetchMock from "jest-fetch-mock"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { ClientError, computeHmac, parseRecognitionResponse, postRecognition, toRecognitionContentType, toRecognitionError, TServerHTTPConfiguration } from "@/iink"

describe("HTTPRecognition.ts", () => {
  const server: TServerHTTPConfiguration = {
    scheme: "https",
    host: "recognition-test",
    applicationKey: "app-key",
    hmacKey: "hmac-key",
    version: "3.2.0",
  }
  const url = "https://recognition-test/api/v4.0/iink/recognize"

  beforeAll(() => {
    fetchMock.enableMocks()
  })
  afterEach(() => {
    fetchMock.resetMocks()
  })

  describe("postRecognition", () => {
    test("should post the data with the headers the server expects", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ label: "a" }), { headers: { "content-type": "application/json" } })
      const data = { strokes: [] }

      await expect(postRecognition({ url, server, accept: "text/plain", data })).resolves.toEqual({ label: "a" })

      const request = fetchMock.mock.calls[0][0] as Request
      const body = await request.clone().text()
      expect(request.url).toEqual(url)
      expect(request.method).toEqual("POST")
      expect(body).toEqual(JSON.stringify(data))
      expect(request.headers.get("Accept")).toEqual("text/plain")
      expect(request.headers.get("applicationKey")).toEqual("app-key")
      expect(request.headers.get("hmac")).toEqual(await computeHmac(body, "app-key", "hmac-key"))
      expect(request.headers.get("myscript-client-name")).toEqual("iink-ts")
      const { version } = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "package.json"), "utf-8"))
      expect(request.headers.get("myscript-client-version")).toEqual(version)
    })

    test("should not send the client headers to a server older than 2.0.4", async () => {
      fetchMock.mockResponseOnce("")
      await postRecognition({ url, server: { ...server, version: "2.0.3" }, accept: "text/plain", data: {} })
      const request = fetchMock.mock.calls[0][0] as Request
      expect(request.headers.get("myscript-client-name")).toBeNull()
    })

    test("should send the request unsigned when the signature cannot be resolved: the signature is optional", async () => {
      fetchMock.mockResponseOnce("")
      const failingServer = { ...server, sign: () => Promise.reject(new Error("signing endpoint down")) }
      await postRecognition({ url, server: failingServer, accept: "text/plain", data: {} })
      const request = fetchMock.mock.calls[0][0] as Request
      expect(request.headers.get("hmac")).toBeNull()
    })

    test("should send the request unsigned when no HMAC key is configured", async () => {
      fetchMock.mockResponseOnce("")
      await postRecognition({ url, server: { ...server, hmacKey: "" }, accept: "text/plain", data: {} })
      const request = fetchMock.mock.calls[0][0] as Request
      expect(request.headers.get("hmac")).toBeNull()
    })

    test("should throw the API error of a non-2xx response", async () => {
      fetchMock.mockResponseOnce("Bad Gateway", { status: 502, headers: { "content-type": "text/html" } })
      await expect(postRecognition({ url, server, accept: "text/plain", data: {} })).rejects.toEqual({
        code: "502",
        message: "Bad Gateway",
      })
    })
  })

  describe("parseRecognitionResponse", () => {
    test("should read a JIIX body as JSON, or as text when it is not JSON", async () => {
      const headers = { "content-type": "application/vnd.myscript.jiix" }
      await expect(parseRecognitionResponse(new Response('{"a":1}', { headers }))).resolves.toEqual({ a: 1 })
      await expect(parseRecognitionResponse(new Response("not json", { headers }))).resolves.toEqual("not json")
    })

    test("should read an image as a blob", async () => {
      const response = new Response("png", { headers: { "content-type": "image/png" } })
      // Not toBeInstanceOf(Blob): the fetch polyfill and jsdom each have their own Blob
      expect(Object.prototype.toString.call(await parseRecognitionResponse(response))).toEqual("[object Blob]")
    })

    test("should read any other content type as text", async () => {
      const response = new Response("a", { headers: { "content-type": "text/plain" } })
      await expect(parseRecognitionResponse(response)).resolves.toEqual("a")
    })
  })

  describe("toRecognitionContentType", () => {
    test.each([
      ["TEXT", "Text"],
      ["MATH", "Math"],
      ["DIAGRAM", "Diagram"],
      ["Raw Content", "Raw Content"],
    ])("should name %s as %s", (recognitionType, contentType) => {
      expect(toRecognitionContentType(recognitionType)).toEqual(contentType)
    })
  })

  describe("toRecognitionError", () => {
    test("should read an error without code as a connection failure", () => {
      expect(toRecognitionError(new TypeError("Failed to fetch"))).toEqual(new Error(ClientError.CANT_ESTABLISH))
    })

    test("should map a known error code to its message", () => {
      expect(toRecognitionError({ code: "access.not.granted", message: "denied" })).toEqual(
        new Error(ClientError.WRONG_CREDENTIALS)
      )
    })

    test("should keep the server's message for any other code", () => {
      expect(toRecognitionError({ code: "502", message: "Bad Gateway" })).toEqual(new Error("Bad Gateway"))
      expect(toRecognitionError({ code: "502", message: "" })).toEqual(new Error(ClientError.UNKNOWN))
    })
  })
})
