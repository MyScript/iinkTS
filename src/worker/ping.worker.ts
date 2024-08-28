export type TPingWorkerEvent = {
  pingDelay: number
}

self.addEventListener("message", (e: MessageEvent<TPingWorkerEvent>) =>
{
  setInterval(() => {
    postMessage({ type: "ping" })
  }, e.data.pingDelay)
})
