/**
 * The error a recognition server reports in a non-2xx response body.
 * @group Client
 */
export type TApiError = {
  code?: string
  message: string
}

/**
 * Builds a {@link TApiError} from a non-2xx HTTP response, JSON-parsing the body only when the
 * response actually declares a JSON content type. Calling `response.json()` unconditionally
 * throws a confusing `SyntaxError` on HTML error pages, plaintext, or empty bodies (e.g. a raw
 * 502/503 from a reverse proxy in front of the recognition server).
 * @group Client
 */
export async function parseApiError(response: Response): Promise<TApiError> {
  if (response.headers.get("content-type")?.includes("application/json")) {
    return (await response.json()) as TApiError
  }
  return {
    code: response.status.toString(),
    message: await response.text(),
  }
}
