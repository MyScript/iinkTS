/**
 * @group Recognizer
 */
export type TScheme = "https" | "http"

/**
 * @group Recognizer
 */
export type TServerHTTPConfiguration = {
  scheme: TScheme
  host: string
  applicationKey: string
  hmacKey: string | ((applicationKey: string) => Promise<string>)
  version?: string
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultServerHTTPConfiguration: TServerHTTPConfiguration = {
  scheme: "https",
  host: "cloud.myscript.com",
  applicationKey: "",
  hmacKey: "",
  version: "",
}

/**
 * @group Recognizer
 */
export type TServerWebsocketConfiguration = TServerHTTPConfiguration & {
  websocket: {
    pingEnabled: boolean
    pingDelay: number
    maxPingLostCount: number
    autoReconnect: boolean
    maxRetryCount: number
    fileChunkSize: number
    /** Queue `addStrokes()` calls locally while disconnected and replay them in order on reconnect. */
    offlineQueueEnabled: boolean
    /** Max number of queued addStrokes batches; further calls reject once reached. */
    offlineQueueMaxSize: number
    /** Delay in ms between reconnection attempts while offline. */
    reconnectDelay: number
    /** Give up reconnecting (and reject the queue) after this many failed attempts. */
    maxReconnectAttempts: number
  }
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultServerWebsocketConfiguration: TServerWebsocketConfiguration = {
  ...DefaultServerHTTPConfiguration,
  websocket: {
    pingEnabled: true,
    pingDelay: 15000,
    maxPingLostCount: 20,
    autoReconnect: true,
    maxRetryCount: 2,
    fileChunkSize: 300000,
    offlineQueueEnabled: true,
    offlineQueueMaxSize: 50,
    reconnectDelay: 3000,
    maxReconnectAttempts: 10,
  },
}
