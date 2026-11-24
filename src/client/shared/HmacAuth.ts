import { computeHmac } from "./crypto"
import type { TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * Resolves the HMAC signature of `message`: from the server configuration's `sign` function when
 * set, otherwise computed from its `hmacKey`. Returns `undefined` when neither yields a signature.
 * @group Client
 */
export async function resolveHmac(server: TServerHTTPConfiguration, message: string): Promise<string | undefined> {
  if (server.sign) {
    return (await server.sign(message, server.applicationKey)) || undefined
  }
  if (!server.hmacKey) {
    return undefined
  }
  if (typeof server.hmacKey !== "string") {
    throw new Error("server.hmacKey must be a string, use server.sign to sign on a server")
  }
  return computeHmac(message, server.applicationKey, server.hmacKey)
}
