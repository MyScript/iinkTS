import
{
  OIRecognizer,
  Configuration,
  TServerConfiguration,
  TRecognitionConfiguration,
  TOIMessageEvent,
  PartialDeep
} from 'iink-ts'

export class Recognizer extends OIRecognizer
{
  static instance: Recognizer
  messages: string[]

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    super(serverConfig, recognitionConfig)
    this.messages = []
  }

  protected messageCallback(message: MessageEvent<string>)
  {
    super.messageCallback(message)
    const websocketMessage: TOIMessageEvent = JSON.parse(message.data)
    this.messages.push(`Received: ${ websocketMessage.type }`)
  }

  protected closeCallback(evt: CloseEvent): void
  {
    super.closeCallback(evt)
  }

  override send(message: TOIMessageEvent): Promise<void>
  {
    this.messages.push(`Sent: ${ JSON.stringify(message.type) }`)
    return super.send(message)
  }
}

export const useRecognizer = async (): Promise<Recognizer> =>
{
  if (!Recognizer.instance) {
    const res = await fetch("../../../server-configuration.json");
    const server = await res.json();
    const recognition: PartialDeep<TRecognitionConfiguration> = {
      "raw-content": {
        gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
      },
      gesture: {
        enable: true,
        ignoreGestureStrokes: false
      }
    }
    const configuration = new Configuration({ offscreen: true, server, recognition })
    Recognizer.instance = new Recognizer(configuration.server, configuration.recognition)
    await Recognizer.instance.init()
  }

  return Recognizer.instance
}
