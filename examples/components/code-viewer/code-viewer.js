/**
 * Code Viewer — auto-extracts the example's inline <script type="module">
 * and renders it in a side/bottom panel with minimal syntax highlighting.
 *
 * Usage (add at end of <body> in each example):
 *   <link rel="stylesheet" href="../components/code-viewer/code-viewer.css" />
 *   <script type="module" src="../components/code-viewer/code-viewer.js"></script>
 */

const ICON_CODE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
const ICON_COPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`

function dedent(text) {
  const lines = text.split("\n")
  const nonEmpty = lines.filter((l) => l.trim().length > 0)
  if (nonEmpty.length === 0) return text.trim()
  const minIndent = nonEmpty.reduce((min, line) => {
    const spaces = line.match(/^(\s*)/)[1].length
    return Math.min(min, spaces)
  }, Infinity)
  return lines
    .map((l) => l.slice(minIndent))
    .join("\n")
    .trim()
}

async function fetchExternalScript(src) {
  try {
    const res = await fetch(src)
    return res.ok ? dedent(await res.text()) : null
  } catch {
    return null
  }
}

async function extractExampleCode() {
  const scripts = [...document.querySelectorAll('script[type="module"]')]

  // Prefer inline script (most examples)
  const inline = scripts.find((s) => !s.src && s.textContent.trim().length > 50)
  if (inline) return dedent(inline.textContent)

  // Fall back to external module script (skip code-viewer itself)
  const external = scripts.find((s) => s.src && !s.src.includes("code-viewer"))
  if (external) return fetchExternalScript(external.src)

  return null
}

function highlight(raw) {
  const escaped = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  // Single-pass alternation: leftmost match wins, so strings/comments are
  // consumed before keywords/functions can re-process their contents.
  return escaped
    .trim()
    .replace(
      /(\/\/[^\n]*)|(`)([^`]*?)(`)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|\b(\d+\.?\d*)\b|\b(import|export|from|const|let|var|async|await|function|return|if|else|for|of|new|class|extends|try|catch|throw|typeof|instanceof|this|true|false|null|undefined)\b|\b([A-Z][A-Za-z]+)\b(?=\s*[.(])|\b([a-z_$][a-zA-Z0-9_$]*)(?=\s*\()/g,
      (match, cmt, tplQ, _tplBody, _tplE, dbl, sng, num, kw, cls, fn) => {
        if (cmt !== undefined) return `<span class="cv-cmt">${match}</span>`
        if (tplQ !== undefined) return `<span class="cv-str">${match}</span>`
        if (dbl !== undefined) return `<span class="cv-str">${match}</span>`
        if (sng !== undefined) return `<span class="cv-str">${match}</span>`
        if (num !== undefined) return `<span class="cv-num">${match}</span>`
        if (kw !== undefined) return `<span class="cv-kw">${match}</span>`
        if (cls !== undefined) return `<span class="cv-cls">${match}</span>`
        if (fn !== undefined) return `<span class="cv-fn">${match}</span>`
        return match
      }
    )
}

function buildPanel(code) {
  const panel = document.createElement("aside")
  panel.className = "cv-panel"
  panel.setAttribute("aria-label", "Example source code")

  // Header
  const header = document.createElement("div")
  header.className = "cv-panel-header"

  const title = document.createElement("span")
  title.className = "cv-panel-title"
  title.textContent = "Example source"

  const copyBtn = document.createElement("button")
  copyBtn.className = "cv-copy-btn"
  copyBtn.innerHTML = `${ICON_COPY} Copy`
  copyBtn.title = "Copy code to clipboard"
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.innerHTML = `${ICON_CHECK} Copied`
      copyBtn.classList.add("copied")
      setTimeout(() => {
        copyBtn.innerHTML = `${ICON_COPY} Copy`
        copyBtn.classList.remove("copied")
      }, 2000)
    })
  })

  header.appendChild(title)
  header.appendChild(copyBtn)

  // Code wrapper
  const wrapper = document.createElement("div")
  wrapper.className = "cv-code-wrapper"

  const pre = document.createElement("pre")
  pre.innerHTML = highlight(code)

  wrapper.appendChild(pre)
  panel.appendChild(header)
  panel.appendChild(wrapper)

  return panel
}

function buildToggleBtn() {
  const btn = document.createElement("button")
  btn.className = "cv-toggle-btn"
  btn.innerHTML = `${ICON_CODE} &lt;/&gt;`
  btn.title = "Toggle code panel"
  btn.setAttribute("aria-pressed", "false")
  return btn
}

async function init() {
  const code = await extractExampleCode()
  if (!code) return

  const panel = buildPanel(code)
  document.body.appendChild(panel)

  const header = document.querySelector(".header-main")
  if (!header) return

  const toggleBtn = buildToggleBtn()
  header.appendChild(toggleBtn)

  toggleBtn.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("cv-open")
    toggleBtn.classList.toggle("active", isOpen)
    toggleBtn.setAttribute("aria-pressed", String(isOpen))
  })

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("cv-open")) {
      document.body.classList.remove("cv-open")
      toggleBtn.classList.remove("active")
      toggleBtn.setAttribute("aria-pressed", "false")
    }
  })
}

// Run after DOM is ready (modules are deferred by default)
init()
