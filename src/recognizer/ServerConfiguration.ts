/**
 * @group Recognizer
 */
export type TScheme = "https" | "http"

/**
 * @group Recognizer
 */
export type TServerHTTPConfiguration = {
  scheme: TScheme,
  host: string
  applicationKey: string
  hmacKey: string
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
  version: ""
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
    fileChunkSize: 300000
  }
}
