class CustomWebsocketRecognizer extends iink.WSRecognizer {

  constructor(serverConfig, recognitionConfig, elements) {
    super(serverConfig, recognitionConfig)
    this.urlElement = elements.url
    this.sentElement = elements.sent
    this.receivedElement = elements.received
  }

  async init(height, width)
  {
    super.init(height, width)
    this.urlElement.textContent = `connection established at ${this.url}`
  }

  messageCallback(message)
  {
    super.messageCallback(message)
    this.receivedElement.textContent = `Message received: ${message.data}`
  }

  send(message)
  {
    super.send(message)
    this.sentElement.textContent = `Message sent: ${JSON.stringify(message)}`
  }
}
