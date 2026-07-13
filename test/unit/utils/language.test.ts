import { WebSocketSSRClientTextConfiguration } from "../__dataset__/configuration.dataset"
import { getAvailableLanguageList } from "@/iink"

describe("language.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock

  test("should call fetch with good url", async () => {
    await getAvailableLanguageList(WebSocketSSRClientTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${WebSocketSSRClientTextConfiguration?.server?.scheme}://${WebSocketSSRClientTextConfiguration?.server?.host}/api/v4.0/iink/availableLanguageList`
    )
  })

  test("should reject getAvailableLanguageList if no configuration", async () => {
    // @ts-ignore
    getAvailableLanguageList().catch((e) => {
      expect(e.message).toBe(
        "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })

  test("should reject getAvailableLanguageList if configuration.server is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server
    getAvailableLanguageList(conf).catch((e) => {
      expect(e.message).toBe(
        "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })

  test("should reject getAvailableLanguageList if configuration.server.scheme is empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.scheme
    getAvailableLanguageList(conf).catch((e) => {
      expect(e.message).toBe(
        "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })

  test("should reject getAvailableLanguageList if configuration.server.host empty", async () => {
    const conf = JSON.parse(JSON.stringify(WebSocketSSRClientTextConfiguration))
    delete conf?.server?.host
    getAvailableLanguageList(conf).catch((e) => {
      expect(e.message).toBe(
        "Failed to get languages: configuration.server.scheme & configuration.server.host are required!"
      )
    })
  })
})
