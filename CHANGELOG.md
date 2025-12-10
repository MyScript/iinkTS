# [v3.1.1](https://github.com/MyScript/iinkTS/tree/v3.1.1)

## Bugs fix
- fix(RecognizerHTTPV1, RecognizerHTTPV2): add credentials: "omit" option to POST requests
- fix(InteractiveInkEditor): clean root element
- fix(InteractiveInkEditor): remove layer classes on destroy
- fix(rest-raw-content-recognizerInk.html): recognition info is displayed twice on rest_raw_content_recognizerInk example

# [v3.1.0](https://github.com/MyScript/iinkTS/tree/v3.1.0)

## Featues
- feat(Editor) added the option to give a async function for challenge validation [#11](https://github.com/MyScript/iinkTS/issues/10)

## Bugs fix
- fix(offscreen) insert gesture does nothing after convert + undo
- fix(InkEditor.ts) [Raw Content] Show Recognition Blocks button does not work when writing after the check
- fix(InkEditor) wrong default mimeTypes for Math & RawContent

# [v3.0.2](https://github.com/MyScript/iinkTS/tree/v3.0.2)

## Bugs fix
- fix(InkEditor) last undo does not supress 1st result
- fix(InkEditor) eraser does not work
- fix(InkEditor) missing result after undo
- fix(InkEditor) bad recognition displayed when language is not english

# [v3.0.1](https://github.com/MyScript/iinkTS/tree/v3.0.1)

## Features
- feat(InkEditor): change CanvasRenderer with SVGRenderer
- feat(examples): add japanese vertical example

## Bugs fix
- fix(InkEditor): add quiet_period before send recognition request

# [v3.0](https://github.com/MyScript/iinkTS/tree/v3.0)

## Features
- configuration update
  - added classification to raw-content
  - added base lines on jiix
- can resize edges by vertices
- sync strokes with jiix element continuously

## Refactor
- replacing the editor constructor with an editor loader
- delete global configuration, definition of specific configuration per editor
- changing editor instantiation, split editor into separate editors
- centralize layers
- centralize event, rename intention to tool
- separation of smart guide style into a specific file
- separation of menu style into a specific file

## Bugs fix
- fix(Grabber) prevents the pointer cancel for touch event
- fix(Convert) misalignment when converting text
- fix(Interact) keep cursor during shape transformation
- fix(Behaviors) fix change langage to reset init promise and raise event loaded
- fix(RestBehaviors) missing exported event when export function ended

## Samples
- updating the display of exchanged Websocket messages on TLDraw example

## Chore
- chore(deps): upgrade all dependencies

# [v2.0.1](https://github.com/MyScript/iinkTS/tree/v2.0.1)

## Features
- feat(example) add underline & strikethrought gestures on tldraw example
- feat(example) add possibility to disable gesture on tldraw example

## Bugs fix
- fix(Convert) converted word in a group with a stroke disappears after conversion
- fix(Gesture) don't send contextLessGesture if stroke not overlaps symbol
- fix(examples) wrong placement of text after convert in tldraw example
- fix(examples) style broken on websocket_text_customize_editor_css.html

# [v2.0.0](https://github.com/MyScript/iinkTS/tree/v2.0.0)

## Features
- offscreen behaviors

## Refactor
- [suggestion] friendly type declaration [#4](https://github.com/MyScript/iinkTS/issues/4)

# [v1.0.5](https://github.com/MyScript/iinkTS/tree/v1.0.5)

## Refactor
- use the native Crypto module instead of the crypto-js library as the library is no longer maintained [#3](https://github.com/MyScript/iinkTS/issues/3)
- split examples css files
- redesign of the examples homepage style

## Bugs fix
- fix(SmartGuide) it is possible to write just next to the ellipsis
- fix(WSBehaviors) add stroke to model when importPointEvents

# [v1.0.4](https://github.com/MyScript/iinkTS/tree/v1.0.4)

## Bugs fix
- fix(Types) not all types are exported for development
- fix(Model) clear export when strokes changed
- fix(README.md) installing iink-ts from github using readme fails
- fix(install) npm install error after git clone
- fix(style) Editor styles unavailable in shadow dom elements [#2](https://github.com/MyScript/iinkTS/issues/2)
- fix(Convert) Server state randomly corrupts and collapses the iink editor content [#1](https://github.com/MyScript/iinkTS/issues/1)
- fix(examples) math examples don't give result when katex fails
# [v1.0.3](https://github.com/MyScript/iinkTS/tree/v1.0.3)

## Samples
- sample Math with graph

## Bugs fix
- fix(Style) wrong import for custom grabber & custom recognizer

# [v1.0.2](https://github.com/MyScript/iinkTS/tree/v1.0.2)

## Samples
- sample custom grabber for websocket & REST
- sample custom recognizer for websocket & REST
- sample digram REST

## Refactor
- renaming redraw function to importPointEvents

## Chore
- chore(deps): upgrade crypto-js 3.3.0 -> 4.2.0

## Bugs fix
- fix(Stroke) generate uniqId
- fix(Sample) wrong import into dev sample

# [v1.0.1](https://github.com/MyScript/iinkTS/tree/v1.0.1)

## Features
- can redraw JIIX export

## Bugs fix
- fix(Smartguide) hide if no export JIIX
# [v1.0.0](https://github.com/MyScript/iinkTS/tree/v1.0.0)

## Features
- migration javascript to typescript [link](https://github.com/MyScript/iinkTS)
