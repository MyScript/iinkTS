import { isVersionSuperiorOrEqual } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"

import { ClientError, mapErrorCodeToMessage } from "../shared/ClientError"
import { resolveHmac } from "../shared/HmacAuth"
import type { TServerHTTPConfiguration } from "../shared/ServerConfiguration"
import { parseApiError } from "./ClientApiError"

const logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

/**
 * @group Client
 */
export type THTTPRecognitionRequest = {
  url: string
  server: TServerHTTPConfiguration
  /** Value of the `Accept` header */
  accept: string
  data: unknown
}

/**
 * @group Client
 * @summary The `contentType` a recognition request names for a recognition type: `"TEXT"` → `"Text"`, `"Raw Content"` as is
 */
export function toRecognitionContentType(recognitionType: string): string {
  if (recognitionType === "Raw Content") {
    return recognitionType
  }
  return recognitionType.charAt(0).toUpperCase() + recognitionType.slice(1).toLowerCase()
}

/**
 * @group Client
 * @summary Reads a recognition response body according to its content type
 */
export async function parseRecognitionResponse(response: Response): Promise<unknown> {
  switch (response.headers.get("content-type")) {
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "image/png":
    case "image/jpeg":
      return response.blob()
    case "application/json":
      return response.json()
    case "application/vnd.myscript.jiix":
      return response
        .clone()
        .json()
        .catch(() => response.text())
    default:
      return response.text()
  }
}

// The signature is optional for the server: when the key cannot be resolved, the request goes out unsigned
async function signBody(server: TServerHTTPConfiguration, body: string): Promise<string | undefined> {
  try {
    return await resolveHmac(server, body)
  } catch (error) {
    logger.error("signBody", error instanceof Error ? error.message : String(error))
    return undefined
  }
}

async function buildRecognitionHeaders(
  server: TServerHTTPConfiguration,
  accept: string,
  body: string
): Promise<Headers> {
  const headers = new Headers()
  headers.append("Accept", accept)
  headers.append("applicationKey", server.applicationKey)
  const hmac = await signBody(server, body)
  if (hmac) {
    headers.append("hmac", hmac)
  }
  headers.append("Content-Type", "application/json")
  if (server.version && isVersionSuperiorOrEqual(server.version, "2.0.4")) {
    headers.append("myscript-client-name", "iink-ts")
    headers.append("myscript-client-version", __IINK_VERSION__)
  }
  return headers
}

/**
 * @group Client
 * @summary Posts a recognition request and reads its response
 * @remarks `data` is serialized once: the HMAC signs exactly the body sent. Adapt the configuration it holds to the server version before calling.
 * @throws the API error (`{ code, message }`) of a non-2xx response; see {@link toRecognitionError}
 */
export async function postRecognition({ url, server, accept, data }: THTTPRecognitionRequest): Promise<unknown> {
  const body = JSON.stringify(data)
  const headers = await buildRecognitionHeaders(server, accept, body)
  const response = await fetch(new Request(url, { method: "POST", headers, body, credentials: "omit" }))
  if (!response.ok) {
    throw await parseApiError(response)
  }
  return parseRecognitionResponse(response)
}

/**
 * @group Client
 * @summary Turns what a failed {@link postRecognition} threw into the error reported to the caller
 * @remarks An error without code never reached the server (network, CORS): it reads as a connection failure.
 */
export function toRecognitionError(error: unknown): Error {
  const code = readField(error, "code")
  if (!code) {
    return new Error(ClientError.CANT_ESTABLISH)
  }
  const message = readField(error, "message")
  const serverMessage = typeof message === "string" && message ? message : ClientError.UNKNOWN
  return new Error(mapErrorCodeToMessage(String(code)) ?? serverMessage)
}

function readField(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null && key in value ? Reflect.get(value, key) : undefined
}
