import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize, resolve } from "node:path"

/**
 * A static file server over the repository root, so the perf scenarios can be run without the
 * rollup dev watcher. It serves `dist/` and `examples/` as they are on disk; building is the
 * caller's job, which keeps "what is measured" explicit.
 */
const ROOT = resolve(process.cwd())
const PORT = Number(process.env.PERF_SERVER_PORT ?? 8000)

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  const target = join(ROOT, normalize(decodeURIComponent(url.pathname)))
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden")
    return
  }
  try {
    const stats = statSync(target)
    const file = stats.isDirectory() ? join(target, "index.html") : target
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404).end("not found")
  }
}).listen(PORT, () => {
  process.stdout.write(`perf static server on http://localhost:${PORT}\n`)
})
