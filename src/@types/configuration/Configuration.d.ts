import { TEventConfiguration } from "./EventConfiguration"
import { TGrabberConfiguration } from "./GrabberConfiguration"
import { TRecognitionConfiguration, TRecognitionConfigurationClient } from "./RecognitionConfiguration"
import { TRenderingConfiguration } from "./RenderingConfiguration"
import { TServerConfiguration, TServerConfigurationClient } from "./ServerConfiguration"
import { TTriggerConfiguration } from "./TriggerConfiguration"
import { TUndoRedoConfiguration } from "./UndoRedoConfiguration"

export type TConfiguration = {
  server: TServerConfiguration
  recognition: TRecognitionConfiguration
  grabber: TGrabberConfiguration
  rendering: TRenderingConfiguration
  triggers: TTriggerConfiguration
  events: TEventConfiguration
  "undo-redo": TUndoRedoConfiguration
}

export type TConfigurationClient = {
  server?: TServerConfigurationClient
  recognition?: TRecognitionConfigurationClient
  grabber?: TGrabberConfiguration
  rendering?: TRenderingConfiguration
  triggers?: TTriggerConfiguration
  events?: TEventConfiguration
  "undo-redo"?: TUndoRedoConfiguration
}
