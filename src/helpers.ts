import { TConfigurationClient } from "./@types/Configuration"

/**
 * Return the list of available recognition languages
 * @param {Configuration} [configuration] Configuration to get the languages
 * @return {JSON} A list of available languages
 */
 export async function getAvailableLanguageList(configuration?: TConfigurationClient): Promise<Array<Record<string, string>> | never>
 {
   if (configuration?.server?.scheme && configuration?.server?.host) {
     const serverConfig = configuration.server
     const response = await fetch(`${ serverConfig.scheme }://${ serverConfig.host }/api/v4.0/iink/availableLanguageList`)
     return response.json()
   } else {
     return Promise.reject('Cannot get languages ! Please check your server configuration!')
   }
 }