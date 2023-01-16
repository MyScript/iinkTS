import { getAvailableLanguageList } from '../../../src/helpers'
import { ConfigurationTextWebsocket } from '../_dataset/configuration.dataset'

describe('Helpers.ts', () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ fr: 'fr_FR' }),
    }),
  ) as jest.Mock

  test('should getAvailableLanguageList', async () =>
  {
    const languages = await getAvailableLanguageList(ConfigurationTextWebsocket)

    expect(fetch).toBeCalledTimes(1)
    expect(fetch).toBeCalledWith(`${ ConfigurationTextWebsocket?.server?.scheme }://${ ConfigurationTextWebsocket?.server?.host }/api/v4.0/iink/availableLanguageList`)

    expect(languages).toStrictEqual({ fr: 'fr_FR' })
  })

  // test('should reject getAvailableLanguageList if configuration is empty', async () =>
  // {
  //   getAvailableLanguageList()
  //     .catch(e =>
  //     {
  //       expect(e).toBe('Cannot get languages ! Please check your server configuration!')
  //     })
  // })

  test('should reject getAvailableLanguageList if configuration.server is empty', async () =>
  {
    const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
    delete conf?.server
    getAvailableLanguageList(conf)
      .catch(e =>
      {
        expect(e).toBe('Cannot get languages ! Please check your server configuration!')
      })
  })

  test('should reject getAvailableLanguageList if configuration.server.scheme is empty', async () =>
  {
    const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
    delete conf?.server?.scheme
    getAvailableLanguageList(conf)
      .catch(e =>
      {
        expect(e).toBe('Cannot get languages ! Please check your server configuration!')
      })
  })

  test('should reject getAvailableLanguageList if configuration.server.host empty', async () =>
  {
    const conf = JSON.parse(JSON.stringify(ConfigurationTextWebsocket))
    delete conf?.server?.host
    getAvailableLanguageList(conf)
      .catch(e =>
      {
        expect(e).toBe('Cannot get languages ! Please check your server configuration!')
      })
  })

})
