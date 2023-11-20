class CustomRestRecognizer extends iink.RestRecognizer {

  constructor(serverConfig, recognitionConfig, elements) {
    super(serverConfig, recognitionConfig)
    this.urlElement = elements.url
    this.sentElement = elements.sent
    this.receivedElement = elements.received
    this.urlElement.textContent = `Server url: ${this.url}`
  }

  async post(data, mimeType)
  {
    this.sentElement.textContent = `POST: ${JSON.stringify(data)}`
    const response = await super.post(data, mimeType)
    this.receivedElement.textContent = `Response: ${JSON.stringify(response)}`
    return response
  }
}
