import { TGrabberConfiguration } from "./GrabberConfiguration"
import { TRecognitionConfiguration } from "./RecognitionConfiguration"
import { TRenderingConfiguration } from "./RenderingConfiguration"
import { TServerConfiguration } from "./ServerConfiguration"
import { TTriggerConfiguration } from "./TriggerConfiguration"
import { TUndoRedoConfiguration } from "./UndoRedoConfiguration"

export type TConfiguration = {
  server: TServerConfiguration
  recognition: TRecognitionConfiguration
  grabber: TGrabberConfiguration
  rendering: TRenderingConfiguration
  triggers: TTriggerConfiguration
  "undo-redo": TUndoRedoConfiguration
}
