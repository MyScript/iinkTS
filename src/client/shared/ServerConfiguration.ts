/**
 * @group Client
 */
export type TScheme = "https" | "http"

/**
 * @group Client
 * @remarks Signs `message` (the WebSocket HMAC challenge, or the HTTP request body) and resolves
 * the signature as a lowercase hex string, so the HMAC key stays on a server you own.
 * @see computeHmac for the algorithm the server must apply
 */
export type THmacSigner = (message: string, applicationKey: string) => Promise<string>

/**
 * @group Client
 */
export type TServerHTTPConfiguration = {
  scheme: TScheme
  host: string
  applicationKey: string
  /**
   * @remarks Puts the HMAC key in the browser, where anyone can read it: for development only.
   * In production, leave it empty and set `sign`.
   */
  hmacKey: string
  /**
   * @remarks Signs on a server that holds the HMAC key. Takes precedence over `hmacKey`.
   */
  sign?: THmacSigner
  version?: string
}

/**
 * @group Client
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
 * @group Client
 */
export type TServerWebsocketConfiguration = TServerHTTPConfiguration & {
  websocket: {
    pingEnabled: boolean
    pingDelay: number
    maxPingLostCount: number
    /**
     * Reconnect automatically after a drop. `WebSocketClient` then queues the changes made while
     * disconnected and replays them in order, and lets requests wait for the reconnection; off,
     * both reject at once while disconnected.
     */
    autoReconnect: boolean
    /** `WebSocketSSRClient` only: reconnection attempts per send. `WebSocketClient` uses `maxReconnectAttempts`. */
    maxRetryCount: number
    fileChunkSize: number
    /** Max number of changes queued while disconnected; further changes reject once reached. */
    offlineQueueMaxSize: number
    /** Delay in ms between reconnection attempts while offline. */
    reconnectDelay: number
    /** Give up reconnecting (and reject the queue) after this many failed attempts. */
    maxReconnectAttempts: number
  }
}

/**
 * @group Client
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
    offlineQueueMaxSize: 50,
    reconnectDelay: 3000,
    maxReconnectAttempts: 10,
  },
}

/**
 * The URL of a server endpoint, under `/api/v4.0/iink/`. For a websocket, `http`/`https` become
 * `ws`/`wss`. Query values are URI-encoded; `endpoint` is used as given.
 * @group Client
 */
export function serverUrl(
  server: Pick<TServerHTTPConfiguration, "scheme" | "host">,
  endpoint: string,
  { websocket = false, query = {} }: { websocket?: boolean; query?: Record<string, string> } = {}
): string {
  const scheme = websocket ? (server.scheme === "https" ? "wss" : "ws") : server.scheme
  const search = Object.entries(query)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")
  return `${scheme}://${server.host}/api/v4.0/iink/${endpoint}${search ? `?${search}` : ""}`
}

/**
 * Assert that server config has both scheme and host. Throws if either is missing.
 * @group Client
 */
export function assertServerConfig(
  server: { scheme?: string; host?: string } | undefined,
  errorPrefix: string
): asserts server is {
  scheme: string
  host: string
} {
  if (!server?.scheme || !server?.host) {
    throw new Error(`${errorPrefix}: configuration.server.scheme & configuration.server.host are required!`)
  }
}

const isObject = (object: unknown): object is Record<string, unknown> => {
  return typeof object === "object" && object !== null && !Array.isArray(object)
}

/**
 * Returns a copy of `config` with the server credentials replaced by `[REDACTED]`, so a
 * configuration can be logged without leaking the application and HMAC keys.
 * @group Client
 */
export const redactServerSecrets = (config: unknown): unknown => {
  if (!isObject(config) || !isObject(config.server)) {
    return config
  }
  const server: Record<string, unknown> = { ...config.server }
  if ("hmacKey" in server) {
    server.hmacKey = "[REDACTED]"
  }
  if ("applicationKey" in server) {
    server.applicationKey = "[REDACTED]"
  }
  return { ...config, server }
}
