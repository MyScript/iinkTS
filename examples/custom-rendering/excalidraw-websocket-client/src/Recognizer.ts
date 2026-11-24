import
{
  WebSocketClient,
  TPartialDeep,
  TRecognitionWebSocketConfiguration,
  TServerWebsocketConfiguration
} from "iink-ts"

const recognition: TPartialDeep<TRecognitionWebSocketConfiguration> = {
  "raw-content": {
    gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
  },
  gesture: {
    enable: true,
    ignoreGestureStrokes: false
  }
}

export const createRecognizer = async (server: TPartialDeep<TServerWebsocketConfiguration>): Promise<WebSocketClient> =>
{
  const client = new WebSocketClient({ server, recognition })
  await client.init()
  return client
}
