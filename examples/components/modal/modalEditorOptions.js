export class ModalEditorOptions {
  static #init() {
    if (this.modal) return
    this.#loadCSS()

    const createElement = (t, p = {}, ...c) =>
      Object.assign(
        document.createElement(t),
        p,
        c.length ? { appendChild: c[0] } : {}
      )
    const getItemStorage = (k) => {
      return JSON.parse(window.localStorage.getItem("server") || "{}")[k]
    }

    this.modal = createElement("div", { className: "modal" })
    this.container = createElement("div", { className: "modal-container" })
    this.inputContainer = createElement("div", {
      className: "modal-input-container",
    })
    this.modal.appendChild(this.container)

    this.scheme = createElement("select")
    this.scheme.add(new Option("https", "https"))
    this.scheme.add(new Option("http", "http"))

    const schemeLabel = createElement("label", {
      innerText: "Scheme:",
      className: "app-key-label",
    })
    this.scheme.value = getItemStorage("scheme") || "https"
    schemeLabel.appendChild(this.scheme)

    this.host = createElement("input", {
      type: "text",
      placeholder: "Host",
      value: getItemStorage("host") || "cloud.myscript.com",
      className: "app-key-input",
    })
    const hostLabel = createElement("label", {
      innerText: "Host:",
      className: "app-key-label",
    })
    hostLabel.appendChild(this.host)

    this.title = createElement("h2")
    this.container.appendChild(this.title)

    this.message = createElement("a", {
      href: "https://developer.myscript.com/getting-started/",
      className: "modal-message",
      target: "_blank",
      rel: "noopener noreferrer",
    })
    this.container.appendChild(this.message)

    const mkInput = (txt, id, def) => {
      const lbl = createElement("label", {
        innerText: txt,
        className: "app-key-label",
        htmlFor: id,
      })
      const inp = createElement("input", {
        type: "text",
        id,
        className: "app-key-input",
        placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        value: getItemStorage(def) || "",
      })
      lbl.appendChild(inp)
      return [lbl, inp]
    }

    ;[this.labelAppKey, this.inputField] = mkInput(
      "Application Key:",
      "appKeyInput",
      "applicationKey"
    )
    ;[this.labelHmacKey, this.inputFieldHmac] = mkInput(
      "HMAC Key:",
      "appKeyInputHmac",
      "hmacKey"
    )

    this.saveBtn = createElement("button", {
      id: "saveBtn",
      className: "save",
      innerText: "Save",
      onclick: () => this.setSave(),
    })

    this.inputContainer.append(
      schemeLabel,
      hostLabel,
      this.labelAppKey,
      this.labelHmacKey,
      this.saveBtn
    )

    this.container.appendChild(this.inputContainer)
    this.messageFooter = createElement("a", {
      href: "https://cloud.myscript.com/#/applications",
      target: "_blank",
      rel: "noopener noreferrer",
      className: "modal-footer-message",
      innerText:
        "Already have an Application Key and HMAC Key? Go to MyScript Cloud to retrieve them.",
    })
    this.container.appendChild(this.messageFooter)
    this.modal.appendChild(createElement("div", { className: "modal-content" }))
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
    this.title.innerText = "Set your Application Key and HMAC Key"
    this.callback = callback
    this.message.innerText =
      "You can generate your Application Key and HMAC Key for free"
    document.body.appendChild(this.modal)
    document.body.classList.add("stop-scrolling")
  }

  static hide() {
    if (document.body.contains(this.modal)) {
      document.body.removeChild(this.modal)
    }
    document.body.classList.remove("stop-scrolling")
  }

  static setSave() {
    if (!this.options) {
      this.options = {}
    }
    if (!this.options.configuration) {
      this.options.configuration = {}
    }
    if (!this.options.configuration.server) {
      this.options.configuration.server = {}
    }
    this.options.configuration.server.applicationKey = this.inputField.value
    this.options.configuration.server.hmacKey = this.inputFieldHmac.value
    this.options.configuration.server.host = this.host.value
    this.options.configuration.server.scheme = this.scheme.value
    window.localStorage.setItem(
      "server",
      JSON.stringify(this.options.configuration.server)
    )
    this.callback?.(this.options)
    this.hide()
  }
}
