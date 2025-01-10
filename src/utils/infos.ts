import { TServerHTTPConfiguration } from "../recognizer"
import { PartialDeep } from "./types"

/**
 * @group Utils
 */
export type TApiInfos = {
  version: string,
  gitCommit: string,
  nativeVersion: string
}

/**
 * @group Utils
 */
export async function getApiInfos(configuration?: PartialDeep<{ server: TServerHTTPConfiguration }>): Promise<TApiInfos>
{
  try {
    if (!configuration?.server?.scheme && !configuration?.server?.host) {
      return Promise.reject("Failed to get infos: configuration.server.scheme & configuration.server.host are required!")
    }
    const response = await fetch(`${ configuration.server.scheme }://${ configuration.server.host }/api/v4.0/iink/version`)
    if (response.ok) {
      const version = await response.json() as TApiInfos
      return version
    }
    else {
      //latest version published before this endpoint
      return { version: "3.1.3", gitCommit: "unknown", nativeVersion: "<=3.1.1" }
    }

  } catch {
    //latest version published before this endpoint
    return { version: "3.1.3", gitCommit: "7e148bd566438ca77dc83cb4edcc6ed0f51a8a15", nativeVersion: "<=3.1.1" }
   }

}
