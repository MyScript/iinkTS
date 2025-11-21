import
{
  RecognizerWebSocket,
  TRecognizerWebSocketConfiguration,
  TRecognizerWebSocketMessage,
  PartialDeep,
  TServerWebsocketConfiguration,
  TRecognitionWebSocketConfiguration
} from 'iink-ts'

export class Recognizer extends RecognizerWebSocket
{
  static initializing = false
  static instance: Recognizer
  messages: { state: "Sent" | "Received", message: TRecognizerWebSocketMessage }[]

  constructor(config: PartialDeep<TRecognizerWebSocketConfiguration>)
  {
    super(config)
    this.messages = []
  }

  protected messageCallback(message: MessageEvent<string>)
  {
    super.messageCallback(message)
    const websocketMessage: TRecognizerWebSocketMessage = JSON.parse(message.data)
    this.messages.push({ state: "Received", message: websocketMessage })
  }

  override send(message: TRecognizerWebSocketMessage): Promise<void>
  {
    this.messages.push({ state: "Sent", message })
    return super.send(message)
  }

  override destroy(): Promise<void>
  {
    Recognizer.initializing = false
    return super.destroy()
  }
}

export const useRecognizer = async (serverConfiguration: PartialDeep<TServerWebsocketConfiguration>): Promise<Recognizer> =>
  {
  if (!Recognizer.initializing) {
    Recognizer.initializing = true
    const recognition: PartialDeep<TRecognitionWebSocketConfiguration> = {
      "raw-content": {
        gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
      },
      gesture: {
        enable: true,
        ignoreGestureStrokes: false
      }
    }
    Recognizer.instance = new Recognizer({ server: serverConfiguration, recognition })
    await Recognizer.instance.init()
  }

  return Recognizer.instance
}
