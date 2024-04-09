import { ConfigurationTextWebsocket } from "../__dataset__/configuration.dataset"
import { getAvailableLanguageList } from "../../../src/iink"

describe("language.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ fr: "fr_FR" }),
    }),
  ) as jest.Mock

  test("should call fetch with good url", async () =>
  {
    await getAvailableLanguageList(ConfigurationTextWebsocket)
    expect(fetch).toBeCalledTimes(1)
    expect(fetch).toBeCalledWith(`${ ConfigurationTextWebsocket?.server?.scheme }://${ ConfigurationTextWebsocket?.server?.host }/api/v4.0/iink/availableLanguageList`)
  })

  test("should reject getAvailableLanguageList if no configuration", async () =>
  {
    // @ts-ignore
    getAvailableLanguageList()
      .catch(e =>
      {
        expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableLanguageList if configuration.server is empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
    delete conf?.server
    getAvailableLanguageList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableLanguageList if configuration.server.scheme is empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
    delete conf?.server?.scheme
    getAvailableLanguageList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableLanguageList if configuration.server.host empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
    delete conf?.server?.host
    getAvailableLanguageList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
      })
  })
})
