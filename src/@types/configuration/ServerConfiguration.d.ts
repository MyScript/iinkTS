export type TProtocol = "WEBSOCKET" | "REST"

export type TSchene = "https" | "http"

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

export type TServerConfigurationClient = {
  protocol?: TProtocol,
  scheme?: TSchene,
  host?: string
  applicationKey?: string
  hmacKey?: string
  version?: string
  useWindowLocation?: boolean
  websocket?: {
    pingEnabled?: boolean
    pingDelay?: number
    maxPingLostCount?: number
    autoReconnect?: boolean
    maxRetryCount?: number
    fileChunkSize?: number
  }
}
