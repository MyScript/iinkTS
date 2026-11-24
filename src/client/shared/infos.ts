import type { TPartialDeep } from "@/core"

import { getJSON } from "./getJSON"
import { assertServerConfig, type TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Client
 */
export type TApiInfos = {
  version: string
  gitCommit: string
  nativeVersion: string
}

/**
 * @group Client
 */
export async function getApiInfos(
  configuration?: TPartialDeep<{
    server: TServerHTTPConfiguration
  }>
): Promise<TApiInfos> {
  try {
    assertServerConfig(configuration?.server, "Failed to get infos")
    return await getJSON<TApiInfos>(configuration.server, "version")
  } catch {
    // No such endpoint, or no answer: the server predates it, so it is at most the last version
    // published without it
    return {
      version: "3.1.3",
      gitCommit: "unknown",
      nativeVersion: "<=3.1.1",
    }
  }
}

/**
 * @group Client
 * @summary The server version, fetched once and stored in the configuration
 */
export async function ensureServerVersion(configuration: { server: TServerHTTPConfiguration }): Promise<string> {
  if (!configuration.server.version) {
    configuration.server.version = (await getApiInfos(configuration)).version
  }
  return configuration.server.version
}
