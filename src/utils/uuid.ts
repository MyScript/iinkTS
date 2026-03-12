
/**
 * @group Utils
 */
export function createUUID(): string
{
  const getRandomBytes = (): Uint8Array => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(16))
    }
    const bytes = new Uint8Array(16)
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return bytes
  }

  const randomValues = getRandomBytes()
  randomValues[6] = (randomValues[6]! & 0x0f) | 0x40
  randomValues[8] = (randomValues[8]! & 0x3f) | 0x80

  return Array.from(randomValues, (byte, i) => {
    if (i === 4 || i === 6 || i === 8 || i === 10) return "-"
    return byte.toString(16).padStart(2, "0")
  }).join("")
}
