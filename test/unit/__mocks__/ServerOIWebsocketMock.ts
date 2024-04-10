import Server from "jest-websocket-mock"
import { DeserializedMessage } from "jest-websocket-mock/lib/websocket"
import { TWSMessageEvent } from "../../../src/recognizer"

export const ackWithHMACMessage = {
  "type": "ack",
  "hmacChallenge": "1f434e8b-cc46-4a8c-be76-708eea2ff305",
  "iinkSessionId": "c7e72186-6299-4782-b612-3e725aa126f1"
}

export const ackMessageWithoutHMAC = {
  "type": "ack",
  "iinkSessionId": "c7e72186-6299-4782-b612-3e725aa126f1"
}

export const contentPackageDescriptionMessage = {
  "type": "contentPackageDescription",
  "contentPartCount": 0
}

export const partChangeMessage = {
  "type": "partChanged",
  "partIdx": 0,
  "partId": "yyrrutgk",
  "partCount": 1
}

export const newPartMessage = {
  "type": "newPart",
  "idx": 0,
  "id": "lqrcoxjl"
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
          case "newContentPackage":
            if (withHMAC) {
              socket.send(JSON.stringify(ackWithHMACMessage))
            }
            else {
              socket.send(JSON.stringify(ackMessageWithoutHMAC))
            }
            break
          case "hmac":
            socket.send(JSON.stringify(contentPackageDescriptionMessage))
            break
          case "configuration":
            socket.send(JSON.stringify(partChangeMessage))
            break
          case "newContentPart":
            socket.send(JSON.stringify(newPartMessage))
            break
          default:
            break
        }
      })
    })
  }

  sendAckWithHMAC()
  {
    this.send(JSON.stringify(ackWithHMACMessage))
  }

  sendAckWithoutHMAC()
  {
    this.send(JSON.stringify(ackMessageWithoutHMAC))
  }

  sendContentPackageDescription()
  {
    this.send(JSON.stringify(contentPackageDescriptionMessage))
  }

  sendPartChangeMessage()
  {
    this.send(JSON.stringify(partChangeMessage))
  }

  sendNewPartMessage()
  {
    this.send(JSON.stringify(newPartMessage))
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
