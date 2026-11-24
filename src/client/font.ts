import type { TPartialDeep } from "@/core"

import { getJSON } from "./shared/getJSON"
import { assertServerConfig, type TServerHTTPConfiguration } from "./shared/ServerConfiguration"

/**
 * @group Client
 */
export async function getAvailableFontList(
  configuration: TPartialDeep<{
    server: TServerHTTPConfiguration
    recognition: { lang: string }
  }>
): Promise<Array<string>> {
  assertServerConfig(configuration?.server, "Failed to get fonts")
  if (!configuration?.recognition?.lang) {
    throw new Error("Failed to get fonts: configuration.recognition.lang is required!")
  }
  const { result } = await getJSON<{ result: string[] }>(
    configuration.server,
    `font/google/language/${configuration.recognition.lang}`
  )
  return result.sort()
}
