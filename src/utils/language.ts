import { DeepPartial, TConfiguration } from "../@types"

export async function getAvailableLanguageList(configuration: DeepPartial<TConfiguration>): Promise<Array<Record<string, string>>>
{
  if (configuration?.server?.scheme && configuration?.server?.host) {
    const serverConfig = configuration.server
    const response = await fetch(`${ serverConfig.scheme }://${ serverConfig.host }/api/v4.0/iink/availableLanguageList`)
    return response.json()
  } else {
    return Promise.reject("Failed to get languages: configuration.server.scheme & configuration.server.host are required!")
  }
}
