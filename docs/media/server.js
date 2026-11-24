/**
 * Minimal signing server: holds the HMAC key so the browser never sees it.
 *
 *   node --env-file=.env.local examples/server-signing/server.js
 *
 * Reads APPLICATION_KEY, HMAC_KEY, HOST and SCHEME (the keys of `.env.local`), listens on
 * SIGNING_PORT (8787) and answers the page served from ALLOWED_ORIGIN (http://localhost:8000).
 *
 * This example authenticates nobody. In production, mount `/sign` behind your own authentication
 * (session cookie, token) and rate-limit it: whoever can call it can get messages signed.
 */
import { Buffer } from "node:buffer"
import { createServer } from "node:http"
import process from "node:process"

import { signMessage } from "./signature.js"

const { APPLICATION_KEY, HMAC_KEY, HOST = "cloud.myscript.com", SCHEME = "https" } = process.env
const PORT = Number(process.env.SIGNING_PORT ?? 8787)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:8000"
// An HTTP recognition request signs its whole body, strokes included
const MAX_BODY_BYTES = 10 * 1024 * 1024

if (!APPLICATION_KEY || !HMAC_KEY) {
  console.error("APPLICATION_KEY and HMAC_KEY are required")
  process.exit(1)
}

function send(response, status, body) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  })
  response.end(body === undefined ? undefined : JSON.stringify(body))
}

async function readJson(request) {
  let size = 0
  const chunks = []
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      throw new Error("body too large")
    }
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"))
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    return send(response, 204)
  }
  // Public values: the page fetches them instead of hard-coding them
  if (request.method === "GET" && request.url === "/configuration") {
    return send(response, 200, { scheme: SCHEME, host: HOST, applicationKey: APPLICATION_KEY })
  }
  if (request.method === "POST" && request.url === "/sign") {
    try {
      const { message } = await readJson(request)
      if (typeof message !== "string") {
        return send(response, 400, { error: "message must be a string" })
      }
      return send(response, 200, { signature: signMessage(message, APPLICATION_KEY, HMAC_KEY) })
    } catch (error) {
      return send(response, 400, { error: error.message })
    }
  }
  send(response, 404, { error: "not found" })
})

server.listen(PORT, () => {
  console.log(`Signing server on http://localhost:${PORT}, accepting ${ALLOWED_ORIGIN}`)
})
