import Hex from "crypto-js/enc-hex"
import HmacSHA512 from "crypto-js/hmac-sha512"

export function computeHmac (message: string, applicationKey: string, hmacKey: string): string {
  const hmac = new HmacSHA512(message, applicationKey + hmacKey)
  return hmac.toString(Hex) as string
}
