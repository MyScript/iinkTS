/**
 * @group Utils
 */
export async function computeHmac(message: string, applicationKey: string, hmacKey: string): Promise<string>
{
  const enc = new TextEncoder()
  const messageEncoded = enc.encode(message)
  const keyEncoded = enc.encode(applicationKey + hmacKey)

  const key = await crypto.subtle.importKey(
    "raw",
    keyEncoded,
    {
      name: "HMAC",
      hash: { name: "SHA-512" }
    },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    messageEncoded
  )

  const buffer = new Uint8Array(signature)
  return Array.prototype.map.call(buffer, x => x.toString(16).padStart(2, "0")).join("")
}
