import { useCallback, useEffect, useRef, useState } from "react"
import { Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw"
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types"
import { WebSocketClient, TJIIXElement, TJIIXExport, TPartialDeep, TServerWebsocketConfiguration } from "iink-ts"

import { createRecognizer } from "./Recognizer"
import { Synchronizer } from "./Synchronizer"
import { GestureManager } from "./GestureManager"
import { convert, strokeIdsOf } from "./Converter"
import { isFreeDraw } from "./FreeDrawStroke"
import { highlightStrokes, updateScene } from "./Scene"
import { Loading } from "./components/Loading"
import { Modal } from "./components/Modal"
import { KeyForms } from "./components/KeyForms"
import { Header } from "./components/Header"
import { RecognitionPanel } from "./components/RecognitionPanel"
import { useTheme } from "./theme"

declare global
{
  interface Window
  {
    /** Exposed for the end-to-end tests: Excalidraw draws on a canvas, the scene is not in the DOM */
    excalidrawAPI?: ExcalidrawImperativeAPI
  }
}

type TServer = TPartialDeep<TServerWebsocketConfiguration>

const readStoredServer = (): TServer | undefined =>
{
  const stored = window.localStorage.getItem("server")
  if (!stored) return
  const server: TServer = JSON.parse(stored)
  return server
}

// Opens on the pen: the example is about handwriting
const INITIAL_DATA: ExcalidrawInitialDataState = {
  appState: { activeTool: { type: "freedraw", customType: null, lastActiveTool: null, locked: false } }
}

const toMessage = (error: unknown): string => error instanceof Error ? error.message : String(error)

// Same blue as the example header (--ex-primary)
const HIGHLIGHT_COLOR = "#1a9fff"

// The server answers each stroke batch with a contentChanged: a burst of them yields one export
const RECOGNITION_REFRESH_DELAY_MS = 300

export default function App()
{
  const [serverConfiguration, setServerConfiguration] = useState<TServer | undefined>(readStoredServer)
  const [api, setApi] = useState<ExcalidrawImperativeAPI>()
  const [recognizer, setRecognizer] = useState<WebSocketClient>()
  const [synchronizer, setSynchronizer] = useState<Synchronizer>()
  const [errors, setErrors] = useState<string[]>([])
  const [jiix, setJiix] = useState<TJIIXExport>()
  const [showKeys, setShowKeys] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const gestureManagerRef = useRef<GestureManager>()
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const clearHighlightRef = useRef<() => void>()

  const addError = useCallback((error: unknown) => setErrors(previous => [...previous, toMessage(error)]), [])

  const scheduleRecognitionRefresh = useCallback((client: WebSocketClient) =>
  {
    clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() =>
    {
      client.export(["application/vnd.myscript.jiix"])
        .then(exports => setJiix(exports["application/vnd.myscript.jiix"]))
        .catch(addError)
    }, RECOGNITION_REFRESH_DELAY_MS)
  }, [addError])

  useEffect(() =>
  {
    if (!serverConfiguration) return
    let cancelled = false
    let client: WebSocketClient | undefined
    createRecognizer(serverConfiguration)
      .then(c =>
      {
        client = c
        if (cancelled) {
          c.destroy()
          return
        }
        // Registered once per client: listeners live until the client is destroyed
        c.event.addGestureDetectedListener(gesture => gestureManagerRef.current?.apply(gesture))
        c.event.addErrorListener(addError)
        c.event.addContentChangedListener(() => scheduleRecognitionRefresh(c))
        setRecognizer(c)
      })
      .catch(addError)
    return () =>
    {
      cancelled = true
      clearTimeout(refreshTimerRef.current)
      client?.destroy()
      setRecognizer(undefined)
      setJiix(undefined)
    }
  }, [serverConfiguration, addError, scheduleRecognitionRefresh])

  useEffect(() =>
  {
    if (!api || !recognizer) return
    const sync = new Synchronizer(recognizer)
    sync.onError = addError
    sync.applyGesture = stroke => gestureManagerRef.current?.applyOnConverted(recognizer, stroke) ?? Promise.resolve(false)
    const unsubscribe = api.onChange((elements, appState) => sync.onChange(elements, appState))
    setSynchronizer(sync)
    return () =>
    {
      unsubscribe()
      sync.destroy()
      setSynchronizer(undefined)
    }
  }, [api, recognizer, addError])

  const onExcalidrawMounted = useCallback((excalidrawAPI: ExcalidrawImperativeAPI) =>
  {
    window.excalidrawAPI = excalidrawAPI
    gestureManagerRef.current = new GestureManager(excalidrawAPI)
    setApi(excalidrawAPI)
  }, [])

  const highlightElement = useCallback((element?: TJIIXElement) =>
  {
    clearHighlightRef.current?.()
    clearHighlightRef.current = api && element ? highlightStrokes(api, strokeIdsOf(element), HIGHLIGHT_COLOR) : undefined
  }, [api])

  // A refreshed recognition may no longer hold the hovered element: its strokes get their colors back
  useEffect(() => highlightElement(), [jiix, highlightElement])

  /**
   * Converts the selected strokes, or every stroke when nothing drawn is selected
   */
  const convertStrokes = useCallback(async () =>
  {
    if (!api || !recognizer || !synchronizer) return
    try {
      await synchronizer.settle()
      const exports = await recognizer.export(["application/vnd.myscript.jiix"])
      const jiix = exports["application/vnd.myscript.jiix"]
      if (!jiix) return
      const strokes = api.getSceneElements().filter(isFreeDraw)
      const selectedIds = api.getAppState().selectedElementIds
      const selected = strokes.filter(s => selectedIds[s.id])
      const { skeletons, convertedStrokeIds } = convert(jiix, selected.length ? selected : strokes)
      updateScene(api, { erase: convertedStrokeIds, add: convertToExcalidrawElements(skeletons) })
    } catch (error) {
      addError(error)
    }
  }, [api, recognizer, synchronizer, addError])

  const saveKeys = (keys: TServer) =>
  {
    window.localStorage.setItem("server", JSON.stringify(keys))
    setShowKeys(false)
    setServerConfiguration(keys)
  }

  const header = (
    <Header
      title="Excalidraw + iinkTS"
      panels={[
        { label: "💡 Info", controls: "info-panel", open: infoOpen, onToggle: () => setInfoOpen(!infoOpen) },
        { label: "🔍 Recognition", controls: "results-panel", open: resultsOpen, onToggle: () => setResultsOpen(!resultsOpen) },
      ]}
      onShowKeys={() => setShowKeys(true)}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )

  if (!serverConfiguration) {
    return (
      <>
        {header}
        <KeyForms onSubmit={saveKeys} />
      </>
    )
  }

  return (
    <>
      {header}
      {showKeys && (
        <div className="keys-overlay" onPointerDown={e => e.target === e.currentTarget && setShowKeys(false)}>
          <KeyForms onSubmit={saveKeys} />
        </div>
      )}
      <div className="ex-page-layout">
        <aside id="info-panel" className={`ex-panel ${ infoOpen ? "open" : "" }`}>
          <p className="ex-panel-heading">Excalidraw as the ink surface</p>
          <p className="ex-panel-intro">
            Excalidraw draws and keeps the scene; iinkTS only talks to the server through a <code>WebSocketClient</code>.
            No iinkTS canvas is mounted.
          </p>
          <div className="ex-panel-divider"></div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Synchronize</div>
            <div className="ex-panel-item-desc">
              Every freedraw element added, moved or erased is sent with <code>addStrokes</code>,
              {" "}<code>replaceStrokes</code> and <code>eraseStrokes</code>.
            </div>
          </div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Recognize</div>
            <div className="ex-panel-item-desc">
              On each <code>contentChanged</code> the JIIX is exported and listed in the right panel.
              Hover an element there to color its strokes.
            </div>
          </div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Convert</div>
            <div className="ex-panel-item-desc">
              The <strong>Convert</strong> button turns the selected strokes, or all of them, into Excalidraw text and shapes.
            </div>
          </div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Gestures</div>
            <div className="ex-panel-item-desc">
              Scratch-out and strike-through erase, underline thickens, surround selects.
              On converted text, underline draws a line under it.
            </div>
          </div>
        </aside>
        <div className="main-layout">
          <div id="rootEl" className="canvas-area">
            {
              errors.map((e, i) => (
                <Modal
                  key={i}
                  type="error"
                  title="Something went wrong"
                  message={e}
                  onClose={() => setErrors(previous => previous.filter((_, j) => j !== i))}
                />
              ))
            }
            <Loading loading={!synchronizer} />
            <Excalidraw
              excalidrawAPI={onExcalidrawMounted}
              initialData={INITIAL_DATA}
              theme={theme}
              renderTopRightUI={() => (
                <button className="convert-btn" data-testid="convert-button" disabled={!synchronizer} onClick={convertStrokes}>
                  Convert
                </button>
              )}
            />
          </div>
          <aside id="results-panel" className={`ex-panel ${ resultsOpen ? "open" : "" }`}>
            <RecognitionPanel jiix={jiix} onHover={highlightElement} />
          </aside>
        </div>
      </div>
    </>
  )
}
