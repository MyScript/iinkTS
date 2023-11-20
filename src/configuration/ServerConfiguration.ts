
/**
 * @group Configuration
 */
export type TProtocol = "WEBSOCKET" | "REST"

/**
 * @group Configuration
 */
export type TSchene = "https" | "http"

/**
 * @group Configuration
 */
export type TServerConfiguration = {
  protocol: TProtocol,
  scheme: TSchene,
  host: string
  applicationKey: string
  hmacKey: string
  version: string
  useWindowLocation?: boolean
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
 * @group Configuration
 */
export const DefaultServerConfiguration: TServerConfiguration = {
  protocol: "WEBSOCKET",
  scheme: "https",
  host: "cloud.myscript.com",
  applicationKey: "",
  hmacKey: "",
  version: "2.1.0",
  useWindowLocation: false,
  websocket: {
    pingEnabled: true,
    pingDelay: 30000,
    maxPingLostCount: 10,
    autoReconnect: true,
    maxRetryCount: 2,
    fileChunkSize: 300000
  }
}
