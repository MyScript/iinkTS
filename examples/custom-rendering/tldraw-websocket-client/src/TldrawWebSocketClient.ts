import
{
  WebSocketClient,
  TWebSocketClientConfiguration,
  TWebSocketClientMessage,
  TPartialDeep,
  TServerWebsocketConfiguration,
  TRecognitionWebSocketConfiguration
} from 'iink-ts'

export class TldrawWebSocketClient extends WebSocketClient
{
  static initializing = false
  static instance: TldrawWebSocketClient
  messages: { state: "Sent" | "Received", message: TWebSocketClientMessage }[]
  private static readonly MAX_MESSAGES = 100

  constructor(config: TPartialDeep<TWebSocketClientConfiguration>)
  {
    super(config)
    this.messages = []
  }

  protected messageCallback(message: MessageEvent<string>)
  {
    super.messageCallback(message)
    const websocketMessage: TWebSocketClientMessage = JSON.parse(message.data)
    this.messages.push({ state: "Received", message: websocketMessage })
    if (this.messages.length > TldrawWebSocketClient.MAX_MESSAGES) {
      this.messages.shift()
    }
  }

  override send(message: TWebSocketClientMessage): Promise<void>
  {
    this.messages.push({ state: "Sent", message })
    if (this.messages.length > TldrawWebSocketClient.MAX_MESSAGES) {
      this.messages.shift()
    }
    return super.send(message)
  }

  override destroy(): Promise<void>
  {
    TldrawWebSocketClient.initializing = false
    return super.destroy()
  }
}

export const useTldrawWebSocketClient = async (serverConfiguration: TPartialDeep<TServerWebsocketConfiguration>): Promise<TldrawWebSocketClient> =>
  {
  if (!TldrawWebSocketClient.initializing) {
    TldrawWebSocketClient.initializing = true
    const recognition: TPartialDeep<TRecognitionWebSocketConfiguration> = {
      "raw-content": {
        gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
      },
      gesture: {
        enable: true,
        ignoreGestureStrokes: false
      }
    }
    TldrawWebSocketClient.instance = new TldrawWebSocketClient({ server: serverConfiguration, recognition })
    await TldrawWebSocketClient.instance.init()
  }

  return TldrawWebSocketClient.instance
}
