export class ModalEditorOptions {
  static #escapeHandler = null

  static #init() {
    if (this.modal) return
    this.#loadCSS()

    const el = (tag, props = {}) => Object.assign(document.createElement(tag), props)

    this.modal = el("div", { className: "modal" })
    this.modal.addEventListener("pointerdown", (e) => {
      if (e.target === this.modal) this.hide()
    })

    this.container = el("div", { className: "modal-container" })
    this.modal.appendChild(this.container)

    const header = el("div", { className: "modal-header" })

    this.title = el("h2")

    const closeBtn = el("button", { className: "modal-close-btn", type: "button" })
    closeBtn.setAttribute("aria-label", "Close")
    closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`
    closeBtn.addEventListener("click", () => this.hide())

    header.appendChild(this.title)
    header.appendChild(closeBtn)
    this.container.appendChild(header)

    this.message = el("a", {
      href: "https://developer.myscript.com/getting-started/",
      className: "modal-message",
      target: "_blank",
      rel: "noopener noreferrer",
    })
    this.container.appendChild(this.message)

    this.inputContainer = el("div", { className: "modal-input-container" })

    this.scheme = el("select")
    this.scheme.add(new Option("https", "https"))
    this.scheme.add(new Option("http", "http"))
    const schemeLabel = el("label", { innerText: "Scheme:", className: "app-key-label" })
    schemeLabel.appendChild(this.scheme)

    this.host = el("input", {
      type: "text",
      placeholder: "Host",
      value: this.#getStorage("host") || "cloud.myscript.com",
      className: "app-key-input",
    })
    const hostLabel = el("label", { innerText: "Host:", className: "app-key-label" })
    hostLabel.appendChild(this.host)

    this.inputField = el("input", {
      type: "text",
      id: "appKeyInput",
      className: "app-key-input",
      placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
      value: this.#getStorage("applicationKey") || "",
    })
    this.labelAppKey = el("label", {
      innerText: "Application Key:",
      className: "app-key-label",
      htmlFor: "appKeyInput",
    })
    this.labelAppKey.appendChild(this.inputField)

    this.inputFieldHmac = el("input", {
      type: "text",
      id: "appKeyInputHmac",
      className: "app-key-input",
      placeholder: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
      value: this.#getStorage("hmacKey") || "",
    })
    this.labelHmacKey = el("label", { innerText: "HMAC Key:", className: "app-key-label", htmlFor: "appKeyInputHmac" })
    this.labelHmacKey.appendChild(this.inputFieldHmac)

    this.saveBtn = el("button", { id: "saveBtn", className: "save", innerText: "Save", type: "button" })
    this.saveBtn.addEventListener("click", () => this.setSave())

    this._validate = () => {
      const valid = !!(this.inputField.value.trim() && this.inputFieldHmac.value.trim())
      this.saveBtn.disabled = !valid
    }
    this.inputField.addEventListener("input", this._validate)
    this.inputFieldHmac.addEventListener("input", this._validate)

    this.inputContainer.append(schemeLabel, hostLabel, this.labelAppKey, this.labelHmacKey, this.saveBtn)
    this.container.appendChild(this.inputContainer)

    this.messageFooter = el("a", {
      href: "https://cloud.myscript.com/#/applications",
      target: "_blank",
      rel: "noopener noreferrer",
      className: "modal-footer-message",
      innerText: "Already have an Application Key and HMAC Key? Go to MyScript Cloud to retrieve them.",
    })
    this.container.appendChild(this.messageFooter)
  }

  static #getStorage(key) {
    return JSON.parse(window.localStorage.getItem("server") || "{}")[key]
  }

  static #loadCSS() {
    if (document.getElementById("modal-css")) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = new URL("modal.css", import.meta.url).href
    link.id = "modal-css"
    document.head.appendChild(link)
  }

  static initConfiguration(callback, options) {
    const localServer = JSON.parse(window.localStorage.getItem("server") || "{}")
    options = options || {}
    options.configuration = options.configuration || {}
    if (localServer.applicationKey && localServer.hmacKey) {
      options.configuration.server = localServer
      callback(options)
      return
    }
    this.show(callback, options)
  }

  static show(callback, options) {
    ModalEditorOptions.#init()
    this.options = options
    this.title.innerText = "Set your server configuration"
    this.callback = callback
    this.message.innerText = "You can generate your Application Key and HMAC Key for free"

    // Refresh stored values each time modal opens
    this.host.value = this.#getStorage("host") || "cloud.myscript.com"
    this.scheme.value = this.#getStorage("scheme") || "https"
    this.inputField.value = this.#getStorage("applicationKey") || ""
    this.inputFieldHmac.value = this.#getStorage("hmacKey") || ""
    this._validate()

    document.body.appendChild(this.modal)
    document.body.classList.add("stop-scrolling")

    this.#escapeHandler = (e) => {
      if (e.key === "Escape") this.hide()
    }
    document.addEventListener("keydown", this.#escapeHandler)
  }

  static hide() {
    if (document.body.contains(this.modal)) {
      document.body.removeChild(this.modal)
    }
    document.body.classList.remove("stop-scrolling")
    if (this.#escapeHandler) {
      document.removeEventListener("keydown", this.#escapeHandler)
      this.#escapeHandler = null
    }
  }

  static setSave() {
    if (!this.options) this.options = {}
    if (!this.options.configuration) this.options.configuration = {}
    if (!this.options.configuration.server) this.options.configuration.server = {}

    this.options.configuration.server.applicationKey = this.inputField.value.trim()
    this.options.configuration.server.hmacKey = this.inputFieldHmac.value.trim()
    this.options.configuration.server.host = this.host.value.trim()
    this.options.configuration.server.scheme = this.scheme.value
    window.localStorage.setItem("server", JSON.stringify(this.options.configuration.server))
    this.callback?.(this.options)
    this.hide()
  }
}
