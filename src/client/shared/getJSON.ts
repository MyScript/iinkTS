import { serverUrl, type TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * GETs a server endpoint and parses its JSON body. Rejects on a non-2xx status, rather than
 * parsing an error page as if it were the answer.
 * @group Client
 */
export async function getJSON<T>(
  server: Pick<TServerHTTPConfiguration, "scheme" | "host">,
  endpoint: string
): Promise<T> {
  const response = await fetch(serverUrl(server, endpoint))
  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed: ${response.status} ${response.statusText}`)
  }
  const body: T = await response.json()
  return body
}
