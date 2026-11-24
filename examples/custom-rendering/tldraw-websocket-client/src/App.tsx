import { useCallback, useEffect, useState, useRef, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Editor, TLDrawShape, TLShapeId, Tldraw, RecordsDiff, TLRecord } from "tldraw"
import { RootState } from "./store"
import { setExports } from "./store/exportsStore"
import { addError, removeError } from "./store/errorsStore"

import { TldrawWebSocketClient, useTldrawWebSocketClient } from "./TldrawWebSocketClient"
import { strokeIdsOf, useConverter } from "./Converter"
import { useSynchronizer } from "./Synchronizer"

import { Loading } from "./components/Loading"

import { MainMenu } from "./components/MainMenu"
import { QuickActions } from "./components/QuickActionsMenu"
import { ContextMenu } from "./components/ContextMenu"
import { TopZone } from "./components/TopZone"
import { Modal } from "./components/Modal"
import { KeyForms } from "./components/KeyForms"
import { TJIIXElement, TJIIXExport, TPartialDeep, TServerWebsocketConfiguration } from "iink-ts"
import { Header } from "./components/Header"
import { RecognitionPanel } from "./components/RecognitionPanel"
import { useTheme } from "./theme"

const EXPORT_MIMETYPES = ["application/vnd.myscript.jiix"]

declare global
{
  interface Window
  {
    /** Exposed for the end-to-end tests: they read the hinted shapes through the editor */
    tldrawEditor?: Editor
  }
}

export default function App()
{
  const [editor, setEditor] = useState<Editor>()
  const [recognizer, setRecognizer] = useState<TldrawWebSocketClient>()
  const [loading, setLoading] = useState<boolean>(true)
  const [showKeys, setShowKeys] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [theme, toggleTheme] = useTheme()

  const [serverConfiguration, setServerConfiguration] = useState<TPartialDeep<TServerWebsocketConfiguration>>()
  const exports = useSelector((state: RootState) => state.exports.value)
  const errors = useSelector((state: RootState) => state.errors.value)
  const dispatch = useDispatch()
  const converter = useConverter()

  const jiix = useMemo(() => exports["application/vnd.myscript.jiix"] as TJIIXExport | undefined, [exports])

  const batchedChangesRef = useRef<{
    added: Map<string, TLDrawShape>,
    updated: Map<string, { prev: TLRecord, current: TLDrawShape }>,
    removed: Map<string, TLDrawShape>
  }>({
    added: new Map(),
    updated: new Map(),
    removed: new Map()
  })
  const UPD_EXPORTS_TABS_DELAY = 500
  const SYNC_BATCH_DELAY = 200
  const AUTO_CONVERT_DELAY = 1000

  const loadRecognizer = async (serverConfig: TPartialDeep<TServerWebsocketConfiguration>) =>
  {
    try {
      setLoading(true)
      await TldrawWebSocketClient.instance?.destroy()
      setRecognizer(await useTldrawWebSocketClient(serverConfig!))
    } catch (error) {
      dispatch(addError(typeof error === "string" ? error as string : (error as Error).message))
    }
    setLoading(false)
  }

  const convertDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const scheduleConversion = useCallback((changedDrawShapes: TLDrawShape[]) =>
  {
    clearTimeout(convertDebounceRef.current)
    convertDebounceRef.current = setTimeout(() =>
    {
      if (changedDrawShapes.length > 0 && editor) {
        const { toConvert, toRemove } = converter.convert(changedDrawShapes)
        if (toConvert.length > 0) {
          // Own undo step: otherwise undo also removes the last stroke drawn
          editor.markHistoryStoppingPoint("convert")
          editor.run(() =>
          {
            editor.deleteShapes(toRemove)
            editor.createShapes(toConvert)
          })
        }
      }
    }, AUTO_CONVERT_DELAY)
  }, [editor, converter])

  const flushSyncBatch = useCallback(() =>
  {
    if (!editor || !recognizer) return

    const batch = batchedChangesRef.current

    const hasChanges = batch.added.size > 0 || batch.updated.size > 0 || batch.removed.size > 0
    if (!hasChanges) return

    const changes: RecordsDiff<TLRecord> = {
      added: Object.fromEntries(batch.added),
      updated: Object.fromEntries(
        Array.from(batch.updated.entries()).map(([id, { prev, current }]) => [id, [prev, current]])
      ),
      removed: Object.fromEntries(batch.removed)
    }

    const shapesToConvert = [
      ...Array.from(batch.added.values()),
      ...Array.from(batch.updated.values()).map(v => v.current)
    ]

    batchedChangesRef.current = {
      added: new Map(),
      updated: new Map(),
      removed: new Map()
    }

    useSynchronizer(editor).sync(changes)
      .then(async () =>
      {
        if (converter.auto && shapesToConvert.length > 0) {
          const exports = await recognizer!.export(EXPORT_MIMETYPES)
          dispatch(setExports(exports))
          converter.invalidateCache()
          scheduleConversion(shapesToConvert)
        }
      })
      .catch(error =>
      {
        dispatch(addError(typeof error === "string" ? error : (error as Error).message))
      })
  }, [editor, recognizer, converter, dispatch, scheduleConversion])

  const syncBatchDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const scheduleSyncBatch = useCallback(() =>
  {
    clearTimeout(syncBatchDebounceRef.current)
    syncBatchDebounceRef.current = setTimeout(() =>
    {
      flushSyncBatch()
    }, SYNC_BATCH_DELAY)
  }, [flushSyncBatch])

  const updateExportsDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const updateExports = async () =>
  {
    clearTimeout(updateExportsDebounceRef.current)
    updateExportsDebounceRef.current = setTimeout(async () =>
    {
      const exports = await recognizer!.export(EXPORT_MIMETYPES)
      dispatch(setExports(exports))
    }, UPD_EXPORTS_TABS_DELAY)
  }

  const onShapeCreated = useCallback(async (shape: TLRecord) =>
  {
    if (!editor || !recognizer) return

    if (shape.typeName !== "shape" || shape.type !== "draw") return
    const drawShape = shape as TLDrawShape
    if (!drawShape.props.isComplete) return

    batchedChangesRef.current.added.set(drawShape.id, drawShape)

    batchedChangesRef.current.updated.delete(drawShape.id)

    scheduleSyncBatch()
  }, [editor, recognizer, scheduleSyncBatch])

  const onShapeChanged = useCallback(async (prev: TLRecord, current: TLRecord) =>
  {
    if (!editor || !recognizer) return

    if (current.typeName !== "shape" || current.type !== "draw") return
    const drawShape = current as TLDrawShape
    if (!drawShape.props.isComplete) return

    if (!batchedChangesRef.current.added.has(drawShape.id)) {
      batchedChangesRef.current.updated.set(drawShape.id, { prev, current: drawShape })
    } else {
      batchedChangesRef.current.added.set(drawShape.id, drawShape)
    }

    scheduleSyncBatch()
  }, [editor, recognizer, scheduleSyncBatch])

  const onShapeRemoved = useCallback(async (shape: TLRecord) =>
  {
    if (!editor || !recognizer) return

    if (shape.typeName !== "shape" || shape.type !== "draw") return
    const drawShape = shape as TLDrawShape

    batchedChangesRef.current.removed.set(drawShape.id, drawShape)

    batchedChangesRef.current.added.delete(drawShape.id)
    batchedChangesRef.current.updated.delete(drawShape.id)

    scheduleSyncBatch()
  }, [editor, recognizer, scheduleSyncBatch])

  const onTLdrawMounted = useCallback((editor: Editor) =>
  {
    window.tldrawEditor = editor
    setEditor(editor)
    editor.setCurrentTool("draw")
  }, [])

  useEffect(() =>
  {
    if (!editor || !recognizer) return

    editor.sideEffects.registerAfterCreateHandler("shape", onShapeCreated)
    editor.sideEffects.registerAfterChangeHandler("shape", onShapeChanged)
    editor.sideEffects.registerAfterDeleteHandler("shape", onShapeRemoved)

    return () =>
    {
      flushSyncBatch()
    }
  }, [editor, recognizer, onShapeCreated, onShapeChanged, onShapeRemoved, flushSyncBatch])

  useEffect(() =>
  {
    if (!editor || !recognizer) return
    recognizer.event.addContentChangedListener(updateExports)

    return () =>
    {
      recognizer.destroy()
    }
  }, [editor, recognizer])

  useEffect(() =>
  {
    editor?.user.updateUserPreferences({ colorScheme: theme })
  }, [editor, theme])

  useEffect(() =>
  {
    if (!TldrawWebSocketClient.instance?.initialized && serverConfiguration) {
      loadRecognizer(serverConfiguration)
    }
  }, [TldrawWebSocketClient.instance?.initialized, serverConfiguration])

  const saveKeys = (keys: TPartialDeep<TServerWebsocketConfiguration>) =>
  {
    window.localStorage.setItem("server", JSON.stringify(keys))
    setShowKeys(false)
    setServerConfiguration(keys)
    loadRecognizer(keys)
  }

  const header = (
    <Header
      title="tldraw + iinkTS"
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
    if (!window.localStorage.getItem("server")) {
      return (
        <>
          {header}
          <KeyForms onSubmit={(keys) =>
          {
            window.localStorage.setItem("server", JSON.stringify(keys))
            setServerConfiguration(keys as TPartialDeep<TServerWebsocketConfiguration>)
          }} />
        </>
      )
    }
    else {
      setServerConfiguration(JSON.parse(window.localStorage.getItem("server")!) as TPartialDeep<TServerWebsocketConfiguration>)
    }
  }

  // tldraw outlines hinted shapes: the hovered element's strokes stand out without touching them
  const highlightElement = (element?: TJIIXElement) =>
  {
    editor?.setHintingShapes(element ? strokeIdsOf(element).map(id => id as TLShapeId) : [])
  }

  return (
    <>
      {header}
      {showKeys && (
        <div className="keys-overlay" onPointerDown={e => e.target === e.currentTarget && setShowKeys(false)}>
          <KeyForms onSubmit={(keys) => saveKeys(keys as TPartialDeep<TServerWebsocketConfiguration>)} />
        </div>
      )}
      <div className="ex-page-layout">
        <aside id="info-panel" className={`ex-panel ${ infoOpen ? "open" : "" }`}>
          <p className="ex-panel-heading">tldraw as the ink surface</p>
          <p className="ex-panel-intro">
            tldraw draws and keeps the shapes; iinkTS only talks to the server through a <code>WebSocketClient</code>.
            No iinkTS canvas is mounted.
          </p>
          <div className="ex-panel-divider"></div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Synchronize</div>
            <div className="ex-panel-item-desc">
              tldraw side effects report every draw shape created, changed or deleted; they are batched and sent to the server.
            </div>
          </div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Convert</div>
            <div className="ex-panel-item-desc">
              <strong>Auto conversion</strong> (top of the canvas) replaces strokes with tldraw text and geo shapes
              once recognized. <strong>Convert</strong> in the main menu does it on demand.
            </div>
          </div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Gestures</div>
            <div className="ex-panel-item-desc">
              Scratch-out erases, underline and strike-through act as set in the main menu.
            </div>
          </div>
          <div className="ex-panel-item">
            <div className="ex-panel-item-label">Recognize</div>
            <div className="ex-panel-item-desc">
              On each <code>contentChanged</code> the JIIX is exported and listed in the right panel.
              Hover an element there to outline its strokes.
            </div>
          </div>
        </aside>
        <div className="main-layout">
          <div id="rootEl" className="canvas-area">
            {
              errors.map((e, i) =>
              {
                return (
                  <Modal
                    key={i}
                    type='error'
                    title="Something went wrong"
                    message={e}
                    onClose={() => dispatch(removeError(e))}
                  />
                )
              })
            }
            <Loading loading={loading} />
            <Tldraw
              components={{
                MainMenu,
                QuickActions,
                ContextMenu,
                TopPanel: TopZone,
                SharePanel: null,
                PageMenu: null
              }}
              onMount={onTLdrawMounted}
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
