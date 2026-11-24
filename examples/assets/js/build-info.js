// @ts-check
/**
 * Footer of the examples home: the iink-ts commit the examples were deployed from, read from
 * build-info.json (written by scripts/build-info.sh at deploy time), and the iink-backend version
 * and commit of the server set in localStorage. Each line only shows when its source answers.
 */
import { getJSON } from "../../../dist/iink.esm.js"

const SHORT_SHA = 7

/**
 * @param {string} name
 * @param {{ version?: string, commit?: string }} infos
 * @returns {string}
 */
function formatLine(name, { version, commit }) {
  return [name, version, commit?.slice(0, SHORT_SHA)].filter(Boolean).join(" · ")
}

/** @returns {Promise<string | undefined>} */
async function iinkTsLine() {
  try {
    const response = await fetch(new URL("../../build-info.json", import.meta.url))
    if (!response.ok) return undefined
    return formatLine("iink-ts", await response.json())
  } catch {
    return undefined
  }
}

/** @returns {Promise<string | undefined>} */
async function backendLine() {
  try {
    const { scheme = "https", host } = JSON.parse(window.localStorage.getItem("server") || "{}")
    if (!host) return undefined
    const { version, gitCommit } = await getJSON({ scheme, host }, "version")
    return formatLine("iink-backend", { version, commit: gitCommit })
  } catch {
    return undefined
  }
}

/** @param {HTMLElement} footer */
export async function renderBuildInfo(footer) {
  const lines = (await Promise.all([iinkTsLine(), backendLine()])).filter(Boolean)
  footer.replaceChildren(
    ...lines.map((line) => {
      const span = document.createElement("span")
      span.textContent = line ?? ""
      return span
    })
  )
  footer.hidden = lines.length === 0
  footer.dataset.loaded = ""
}
