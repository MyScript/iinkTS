/**
 * @group Core
 */
export type TPingWorkerEvent = {
  pingDelay: number
}

let pingInterval: ReturnType<typeof setInterval> | undefined

// A second configuration message replaces the running interval, it does not add a second one.
self.addEventListener("message", (e: MessageEvent<TPingWorkerEvent>) => {
  clearInterval(pingInterval)
  pingInterval = setInterval(() => {
    postMessage({ type: "ping" })
  }, e.data.pingDelay)
})
