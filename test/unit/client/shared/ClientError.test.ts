import { ClientError, mapErrorCodeToMessage } from "@/iink"

describe("ClientError.ts", () => {
  describe("mapErrorCodeToMessage", () => {
    test.each([
      ["no.activity", ClientError.NO_ACTIVITY],
      ["access.not.granted", ClientError.WRONG_CREDENTIALS],
      ["session.too.old", ClientError.TOO_OLD],
      ["restore.session.not.found", ClientError.NO_SESSION_FOUND],
    ])("should map %s to its message", (code, message) => {
      expect(mapErrorCodeToMessage(code)).toEqual(message)
    })

    test("should return undefined for a code without a message of its own", () => {
      expect(mapErrorCodeToMessage("other.code")).toBeUndefined()
      expect(mapErrorCodeToMessage(502)).toBeUndefined()
      expect(mapErrorCodeToMessage(undefined)).toBeUndefined()
    })
  })
})
