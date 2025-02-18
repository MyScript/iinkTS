import
{
  InteractiveInkRecognizer,
  TInteractiveInkRecognizerConfiguration,
  TInteractiveInkMessageEvent,
  PartialDeep,
  TServerWebsocketConfiguration,
  TInteractiveInkRecognitionConfiguration
} from 'iink-ts'

export class Recognizer extends InteractiveInkRecognizer
{
  static initializing = false
  static instance: Recognizer
  messages: { state: "Sent" | "Received", message: TInteractiveInkMessageEvent }[]

  constructor(config: PartialDeep<TInteractiveInkRecognizerConfiguration>)
  {
    super(config)
    this.messages = []
  }

  protected messageCallback(message: MessageEvent<string>)
  {
    super.messageCallback(message)
    const websocketMessage: TInteractiveInkMessageEvent = JSON.parse(message.data)
    this.messages.push({ state: "Received", message: websocketMessage })
  }

  override send(message: TInteractiveInkMessageEvent): Promise<void>
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

export const useRecognizer = async (): Promise<Recognizer> =>
{
  if (!Recognizer.initializing) {
    Recognizer.initializing = true
    const res = await fetch("../../../server-configuration.json")
    const server = await res.json() as PartialDeep<TServerWebsocketConfiguration>
    const recognition: PartialDeep<TInteractiveInkRecognitionConfiguration> = {
      "raw-content": {
        gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
      },
      gesture: {
        enable: true,
        ignoreGestureStrokes: false
      }
    }
    Recognizer.instance = new Recognizer({ server, recognition })
    await Recognizer.instance.init()
  }

  return Recognizer.instance
}
