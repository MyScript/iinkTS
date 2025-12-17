import { RecognizerWebSocketSSRTextConfiguration } from "../__dataset__/configuration.dataset"
import { getAvailableFontList } from "../../../src/iink"

describe("font.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: [] }),
    }),
  ) as jest.Mock

  test("should call fetch with good url", async () =>
  {
    await getAvailableFontList(RecognizerWebSocketSSRTextConfiguration)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(`${ RecognizerWebSocketSSRTextConfiguration?.server?.scheme }://${ RecognizerWebSocketSSRTextConfiguration?.server?.host }/api/v4.0/iink/font/google/language/${ RecognizerWebSocketSSRTextConfiguration?.recognition?.lang }`)
  })

  test("should reject getAvailableFontList if no configuration", async () =>
  {
    // @ts-ignore
    getAvailableFontList()
      .catch(e =>
      {
        expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableFontList if configuration.server is empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.server
    getAvailableFontList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableFontList if configuration.server.scheme is empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.server?.scheme
    getAvailableFontList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableFontList if configuration.server.host empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.server?.host
    getAvailableFontList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get fonts: configuration.server.scheme & configuration.server.host are required!")
      })
  })

  test("should reject getAvailableFontList if configuration.server.host empty", async () =>
  {
    const conf = JSON.parse(JSON.stringify(RecognizerWebSocketSSRTextConfiguration))
    delete conf?.recognition?.lang
    getAvailableFontList(conf)
      .catch(e =>
      {
        expect(e).toBe("Failed to get fonts: configuration.recognition.lang is required!")
      })
  })
})
