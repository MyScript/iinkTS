import
{
  OIRecognizer,
  TOIRecognizerConfiguration,
  TOIMessageEvent,
  PartialDeep,
  TServerWebsocketConfiguration,
  TOIRecognitionConfiguration
} from 'iink-ts'

export class Recognizer extends OIRecognizer
{
  static initializing = false
  static instance: Recognizer
  messages: { state: "Sent" | "Received", message: TOIMessageEvent }[]

  constructor(config: PartialDeep<TOIRecognizerConfiguration>)
  {
    super(config)
    this.messages = []
  }

  protected messageCallback(message: MessageEvent<string>)
  {
    super.messageCallback(message)
    const websocketMessage: TOIMessageEvent = JSON.parse(message.data)
    this.messages.push({ state: "Received", message: websocketMessage })
  }

  override send(message: TOIMessageEvent): Promise<void>
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
    const recognition: PartialDeep<TOIRecognitionConfiguration> = {
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
