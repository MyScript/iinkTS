import { CONNECTION, connectionView } from "../../../../../examples/assets/js/connection.js"

describe("assets/js/connection", () => {
  test("should show the same calm online state whether the client is busy or not", () => {
    // online-working comes back on every stroke: a pill changing with it would flicker
    expect(connectionView("online-idle")).toEqual({ label: CONNECTION.online, tone: "ok", hold: false })
    expect(connectionView("online-working")).toEqual(connectionView("online-idle"))
  })

  test("should hold the verdicts while the ink waits for the server", () => {
    expect(connectionView("offline")).toEqual({ label: CONNECTION.offline, tone: "warn", hold: true, message: CONNECTION.waiting })
    expect(connectionView("syncing")).toEqual({ label: CONNECTION.syncing, tone: "warn", hold: true, message: CONNECTION.waiting })
    expect(connectionView("initializing").hold).toBe(true)
  })

  test("should tell the student when the ink is lost", () => {
    expect(connectionView("error")).toEqual({ label: CONNECTION.error, tone: "error", hold: true, message: CONNECTION.lost })
  })
})
