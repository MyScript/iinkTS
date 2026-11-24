import
{
  WebSocketClient,
  TPartialDeep,
  TServerWebsocketConfiguration,
  TRecognitionWebSocketConfiguration
} from 'iink-ts'

export class TldrawWebSocketClient extends WebSocketClient
{
  static initializing = false
  static instance: TldrawWebSocketClient

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
