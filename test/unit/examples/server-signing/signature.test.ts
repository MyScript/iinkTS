import { computeHmac } from "@/iink"

import { signMessage } from "../../../../examples/server-signing/signature.js"

describe("server-signing/signature.js", () => {
  test("should sign like computeHmac, so the server accepts what the signing server returns", async () => {
    const message = "1f434e8b-cc46-4a8c-be76-708eea2ff305"
    const expected = await computeHmac(message, "app-key", "hmac-key")
    expect(signMessage(message, "app-key", "hmac-key")).toEqual(expected)
  })
})
