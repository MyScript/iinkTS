class CustomWebsocketRecognizer extends iink.InteractiveInkSSRRecognizer {

  constructor(config) {
    super(config)
    this.urlElement = document.getElementById("recognizer-url")
    this.sentElement = document.getElementById("recognizer-sent")
    this.receivedElement = document.getElementById("recognizer-received")
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
