import { useDialogs } from "tldraw"
import { KeyForms } from "./KeyForms"
import { PartialDeep, TServerWebsocketConfiguration } from "iink-ts"

export  function SharePanel({ loadRecognizer }: { loadRecognizer: (keys: PartialDeep<TServerWebsocketConfiguration>) => Promise<void> }) {
  const { addDialog } = useDialogs()

  function ModalKeys({ onClose }: { onClose(): void }) {
    return (
      <div id="123456"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
          <KeyForms
            onSubmit={(keys) => {
              localStorage.setItem("server", JSON.stringify(keys))
              loadRecognizer(keys as PartialDeep<TServerWebsocketConfiguration>)
              onClose()
            }}
          />
      </div>
    )
  }

  return (
    <div style={{ padding: 16, gap: 16, display: "flex", pointerEvents: "all" }}>
      <button
        className='modal-button'
        onClick={() => {
          addDialog({
            component: ModalKeys,
            onClose() {
              void null
            },
          })
        }}
      >
        Set keys
      </button>
    </div>
  )
}
