import { resolveHmac, computeHmac, TServerHTTPConfiguration } from "@/iink"

describe("HmacAuth.ts", () => {
  const baseServer: TServerHTTPConfiguration = {
    scheme: "https",
    host: "cloud.myscript.com",
    applicationKey: "app-key",
    hmacKey: "",
  }

  test("should return undefined when no hmacKey is configured", async () => {
    const result = await resolveHmac({ ...baseServer, hmacKey: "" },"data")
    expect(result).toBeUndefined()
  })

  test("should compute the hmac from a string hmacKey", async () => {
    const server = { ...baseServer, hmacKey: "secret-key" }
    const data = "data"
    const expected = await computeHmac(data, server.applicationKey, server.hmacKey)
    const result = await resolveHmac(server, data)
    expect(result).toEqual(expected)
  })

  test("should return the signature of the sign function, with the message and the application key", async () => {
    const sign = jest.fn(async (message: string, applicationKey: string) => `signed-${message}-${applicationKey}`)
    const result = await resolveHmac({ ...baseServer, sign }, "data")
    expect(sign).toHaveBeenCalledWith("data", "app-key")
    expect(result).toEqual("signed-data-app-key")
  })

  test("should prefer the sign function to the hmacKey", async () => {
    const server = { ...baseServer, hmacKey: "secret-key", sign: async () => "signed" }
    const result = await resolveHmac(server, "data")
    expect(result).toEqual("signed")
  })

  test("should return undefined when the sign function resolves an empty signature", async () => {
    const result = await resolveHmac({ ...baseServer, sign: async () => "" }, "data")
    expect(result).toBeUndefined()
  })

  test("should reject with the error of the sign function", async () => {
    const server = { ...baseServer, sign: () => Promise.reject(new Error("signing endpoint down")) }
    await expect(resolveHmac(server, "data")).rejects.toThrow("signing endpoint down")
  })

  test("should throw when hmacKey is not a string", async () => {
    const server = { ...baseServer, hmacKey: async () => "key" } as unknown as TServerHTTPConfiguration
    await expect(resolveHmac(server, "data")).rejects.toThrow("server.hmacKey must be a string, use server.sign to sign on a server")
  })
})
