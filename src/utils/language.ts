import type { TServerHTTPConfiguration } from "@/client"

import type { TPartialDeep } from "./types"
import { assertServerConfig } from "./validation"

/**
 * @group Utilities
 */
export async function getAvailableLanguageList(
  configuration: TPartialDeep<{
    server: TServerHTTPConfiguration
  }>
): Promise<{
  result: { [key: string]: string }
}> {
  assertServerConfig(configuration?.server, "Failed to get languages")
  const response = await fetch(
    `${configuration.server.scheme}://${configuration.server.host}/api/v4.0/iink/availableLanguageList`
  )
  return response.json()
}
