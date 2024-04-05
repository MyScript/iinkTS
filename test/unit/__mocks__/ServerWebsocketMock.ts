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

export const emptyJIIX = {
  "type": "Text",
  "label": "",
  "words": [],
}

export const emptyExportedMessage = {
  "type": "exported",
  "partId": "wyybaqsp",
  "exports": {
    "application/vnd.myscript.jiix": JSON.stringify(emptyJIIX)
  }
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

export const svgPatchMessage = {
  "type": "svgPatch",
  "updates": [
    {
      "type": "REMOVE_ELEMENT",
      "id": "MODEL-dg7f8894033c80"
    },
    {
      "type": "SET_ATTRIBUTE",
      "name": "viewBox",
      "value": "0 0 967 790"
    },
    {
      "type": "SET_ATTRIBUTE",
      "name": "width",
      "value": "967px"
    },
    {
      "type": "INSERT_BEFORE",
      "refId": "G7f8814290820-",
      "svg": "<g id=\"G7f881429b700-\">\n  <g id=\"MODEL-dg7f8894033d00\">\n    <line x1=\"10\" y1=\"35\" x2=\"245.85\" y2=\"35\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"50\" x2=\"245.85\" y2=\"50\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"65\" x2=\"245.85\" y2=\"65\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"80\" x2=\"245.85\" y2=\"80\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"95\" x2=\"245.85\" y2=\"95\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"110\" x2=\"245.85\" y2=\"110\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"125\" x2=\"245.85\" y2=\"125\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"140\" x2=\"245.85\" y2=\"140\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"155\" x2=\"245.85\" y2=\"155\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"170\" x2=\"245.85\" y2=\"170\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"185\" x2=\"245.85\" y2=\"185\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n    <line x1=\"10\" y1=\"200\" x2=\"245.85\" y2=\"200\" stroke=\"rgba(0, 0, 0, 0.160784319)\" stroke-width=\"0.1\"></line>\n  </g>\n</g>\n"
    },
    {
      "type": "REMOVE_ELEMENT",
      "id": "G7f8814290820-"
    }
  ],
  "layer": "MODEL"
}

export const errorNotGrantedMessage = {
  "type": "error",
  "message": "Access not granted",
  "code": "access.not.granted"
}

export class ServerWebsocketMock extends Server
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

  sendEmptyExportMessage()
  {
    this.send(JSON.stringify(emptyExportedMessage))
  }

  sendHExportMessage()
  {
    this.send(JSON.stringify(hExportedMessage))
  }

  sendNotGrantedErrorMessage()
  {
    this.send(JSON.stringify(errorNotGrantedMessage))
  }

  sendSVGPatchMessage()
  {
    this.send(JSON.stringify(svgPatchMessage))
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
