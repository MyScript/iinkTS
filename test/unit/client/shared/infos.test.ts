import { WebSocketSSRClientTextConfiguration } from "../../__dataset__/configuration.dataset"
import { ensureServerVersion, getApiInfos } from "@/iink"

describe("language.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock

  test("should call fetch with good url", async () => {
    await getApiInfos(WebSocketSSRClientTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${WebSocketSSRClientTextConfiguration?.server?.scheme}://${WebSocketSSRClientTextConfiguration?.server?.host}/api/v4.0/iink/version`
    )
  })

  test("should reject getApiInfos if no configuration", async () => {
    // @ts-ignore
    getApiInfos().catch((e) => {
      expect(e.message).toBe(
        "Failed to get infos: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })

  test("should reject getApiInfos if configuration.server is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server
    getApiInfos(conf).catch((e) => {
      expect(e.message).toBe(
        "Failed to get infos: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })

  test("should reject getApiInfos if configuration.server.scheme is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.scheme
    getApiInfos(conf).catch((e) => {
      expect(e.message).toBe(
        "Failed to get infos: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })

  test("should reject getApiInfos if configuration.server.host empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.host
    getApiInfos(conf).catch((e) => {
      expect(e.message).toBe(
        "Failed to get infos: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })
})

describe("ensureServerVersion", () => {
  test("should keep a version already configured, without fetching", async () => {
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy
    const configuration = { server: structuredClone(WebSocketSSRClientTextConfiguration.server) }
    configuration.server.version = "3.2.0"
    await expect(ensureServerVersion(configuration)).resolves.toEqual("3.2.0")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test("should fetch the version once and store it in the configuration", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ version: "3.4.0" }) })
    ) as jest.Mock
    const configuration = { server: structuredClone(WebSocketSSRClientTextConfiguration.server) }
    configuration.server.version = ""
    await expect(ensureServerVersion(configuration)).resolves.toEqual("3.4.0")
    expect(configuration.server.version).toEqual("3.4.0")
  })
})
