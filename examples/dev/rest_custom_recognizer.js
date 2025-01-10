class CustomRestRecognizer extends iink.RestRecognizer {

  constructor(config) {
    super(config)
    this.urlElement = document.getElementById("recognizer-url")
    this.sentElement = document.getElementById("recognizer-sent")
    this.receivedElement = document.getElementById("recognizer-received")

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
