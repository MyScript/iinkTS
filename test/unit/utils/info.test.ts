import { RecognizerWebSocketSSRTextConfiguration } from "../__dataset__/configuration.dataset"
import { getApiInfos } from "../../../src/iink"

describe("language.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    }),
  ) as jest.Mock

  test("should call fetch with good url", async () =>
  {
    await getApiInfos(RecognizerWebSocketSSRTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(`${ RecognizerWebSocketSSRTextConfiguration?.server?.scheme }://${ RecognizerWebSocketSSRTextConfiguration?.server?.host }/api/v4.0/iink/version`)
  })

  test("should reject getApiInfos if no configuration", async () =>
  {
    // @ts-ignore
    getApiInfos()
      .catch(e =>
      {
        expect(e).toBe("Failed to get infos: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getApiInfos if configuration.server is empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.server
    getApiInfos(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get infos: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getApiInfos if configuration.server.scheme is empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.server?.scheme
    getApiInfos(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get infos: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getApiInfos if configuration.server.host empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.server?.host
    getApiInfos(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get infos: configuration.server.scheme & configuration.server.host are required!")
      })
  })
})
