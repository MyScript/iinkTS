import { TEventConfiguration } from "./configuration/EventConfiguration"
import { TGrabberConfiguration } from "./configuration/GrabberConfiguration"
import { TRecognitionConfiguration, TRecognitionConfigurationClient } from "./configuration/RecognitionConfiguration"
import { TRenderingConfiguration } from "./configuration/RenderingConfiguration"
import { TServerConfiguration, TServerConfigurationClient } from "./configuration/ServerConfiguration"
import { TTriggerConfiguration } from "./configuration/TriggerConfiguration"
import { TUndoRedoConfiguration } from "./configuration/UndoRedoConfiguration"

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
