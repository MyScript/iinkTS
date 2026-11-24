import { getJSON } from "@/iink"

describe("getJSON.ts", () => {
  const server = { scheme: "https" as const, host: "cloud.myscript.com" }

  test("should GET the endpoint and parse its JSON body", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ result: [1, 2] }) })) as jest.Mock

    await expect(getJSON(server, "availableLanguageList")).resolves.toEqual({ result: [1, 2] })
    expect(fetch).toHaveBeenCalledWith("https://cloud.myscript.com/api/v4.0/iink/availableLanguageList")
  })

  test("should reject on a non-2xx status instead of parsing the error body", async () => {
    const json = jest.fn()
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 503, statusText: "Service Unavailable", json })) as jest.Mock

    await expect(getJSON(server, "version")).rejects.toThrow("GET version failed: 503 Service Unavailable")
    expect(json).not.toHaveBeenCalled()
  })
})
