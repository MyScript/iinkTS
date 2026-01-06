import { RecognizerHTTPV1 } from '../../dist/iink.esm.js'

export class CustomRestRecognizer extends RecognizerHTTPV1 {
  constructor(config) {
    super(config)
    this.urlElement = document.getElementById('recognizer-url')
    this.sentElement = document.getElementById('recognizer-sent')
    this.receivedElement = document.getElementById('recognizer-received')

    this.urlElement.textContent = `Server url: ${this.url}`
    this.sentElement.textContent = 'Message sent:'
    this.receivedElement.textContent = 'Message received:'
  }

  async post(data, mimeType) {
    this.sentElement.textContent = `POST: ${JSON.stringify(data)}`
    const response = await super.post(data, mimeType)
    this.receivedElement.textContent = `Response: ${JSON.stringify(response)}`
    return response
  }
}
