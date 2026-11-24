import type { TPartialDeep } from "@/core"

import { getJSON } from "./shared/getJSON"
import { assertServerConfig, type TServerHTTPConfiguration } from "./shared/ServerConfiguration"

/**
 * @group Client
 */
export async function getAvailableLanguageList(
  configuration: TPartialDeep<{
    server: TServerHTTPConfiguration
  }>
): Promise<{
  result: { [key: string]: string }
}> {
  assertServerConfig(configuration?.server, "Failed to get languages")
  return getJSON(configuration.server, "availableLanguageList")
}
