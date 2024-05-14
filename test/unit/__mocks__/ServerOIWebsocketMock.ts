import Server from "jest-websocket-mock"
import { DeserializedMessage } from "jest-websocket-mock/lib/websocket"
import { TWSMessageEvent } from "../../../src/recognizer"

export const HMACChallengeMessage = {
  "type": "hmacChallenge",
  "hmacChallenge": "1f434e8b-cc46-4a8c-be76-708eea2ff305",
}

export const authenticatedMessage = {
  "type": "authenticated",
}

export const sessionDescriptionMessage = {
  "type": "sessionDescription",
  "contentPartCount": 0,
  "iinkSessionId":	"39311164-39fb-4ae1-be8f-fa955c89dbd7"
}

export const partChangeMessage = {
  "type": "partChanged",
  "partIdx": 0,
  "partId": "yyrrutgk",
  "partCount": 1
}

export const contentChangeMessage = {
  "type": "contentChanged",
  "partId": "mknnilfn",
  "canUndo": null,
  "canRedo": null,
  "empty": null,
  "undoStackIndex": 0,
  "possibleUndoCount": 0
}

export const hJIIX = {
  "type": "Text",
  "label": "hello",
  "words": [{
    "label": "H",
    "candidates": ["h"]
  }]
}

export const hExportedMessage = {
  "type": "exported",
  "partid": 0,
  "exports": {
    "application/vnd.myscript.jiix": JSON.stringify(hJIIX)
  }
}

export const errorNotGrantedMessage = {
  "type": "error",
  "message": "Access not granted",
  "code": "access.not.granted"
}

export class ServerOIWebsocketMock extends Server
{
  init(withHMAC = false)
  {
    this.on("connection", (socket) =>
    {
      socket.on("message", (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
      {
        const parsedMessage: TWSMessageEvent = JSON.parse(message as string)
        switch (parsedMessage.type) {
          case "authenticate":
            if (withHMAC) {
              socket.send(JSON.stringify(HMACChallengeMessage))
            }
            else {
              socket.send(JSON.stringify(authenticatedMessage))
            }
            break
          case "hmac":
            socket.send(JSON.stringify(authenticatedMessage))
            break
          case "initSession":
          case "restoreSession":
            socket.send(JSON.stringify(sessionDescriptionMessage))
            break
          case "newContentPart":
          case "openContentPart":
            socket.send(JSON.stringify(partChangeMessage))
            break
          default:
            break
        }
      })
    })
  }

  sendHMACChallenge()
  {
    this.send(JSON.stringify(HMACChallengeMessage))
  }

  sendAuthenticated()
  {
    this.send(JSON.stringify(authenticatedMessage))
  }

  sendSessionDescription()
  {
    this.send(JSON.stringify(sessionDescriptionMessage))
  }

  sendPartChangeMessage()
  {
    this.send(JSON.stringify(partChangeMessage))
  }

  sendContentChangeMessage()
  {
    this.send(JSON.stringify(contentChangeMessage))
  }

  sendHExportMessage()
  {
    this.send(JSON.stringify(hExportedMessage))
  }

  sendNotGrantedErrorMessage()
  {
    this.send(JSON.stringify(errorNotGrantedMessage))
  }

  getMessages(type: string): DeserializedMessage<object>[]
  {
    return this.messages.filter((m: DeserializedMessage<object>) =>
    {
      const parseMessage = JSON.parse(m as string) as TWSMessageEvent
      return parseMessage.type === type
    })
  }

  getLastMessage(): DeserializedMessage<object>
  {
    return this.messages[this.messages.length - 1]
  }
}
