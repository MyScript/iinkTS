import { createHmac } from "node:crypto"

/**
 * Signs `message` the way the MyScript server checks it: HMAC-SHA512 keyed by the application key
 * followed by the HMAC key, as a lowercase hex string.
 * @param {string} message the WebSocket HMAC challenge, or the HTTP request body
 * @param {string} applicationKey
 * @param {string} hmacKey
 * @returns {string}
 */
export function signMessage(message, applicationKey, hmacKey) {
  return createHmac("sha512", applicationKey + hmacKey)
    .update(message)
    .digest("hex")
}
