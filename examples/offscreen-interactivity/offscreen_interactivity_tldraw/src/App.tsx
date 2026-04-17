import { useCallback, useEffect, useState, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import ReactJson from "react-json-view"
import { Editor, TLDrawShape, Tldraw, RecordsDiff, TLRecord } from "tldraw"
import { RootState } from "./store"
import { setExports } from "./store/exportsStore"
import { addError, removeError } from "./store/errorsStore"

import { Recognizer, useRecognizer } from "./Recognizer"
import { useConverter } from "./Converter"
import { useSynchronizer } from "./Synchronizer"

import { Loading } from "./components/Loading"

import { ExportHTMLTab } from "./components/ExportHTMLTab"
import { MainMenu } from "./components/MainMenu"
import { QuickActions } from "./components/QuickActionsMenu"
import { ContextMenu } from "./components/ContextMenu"
import { Modal } from "./components/Modal"
import { KeyForms } from "./components/KeyForms"
import { PartialDeep, TServerWebsocketConfiguration } from "iink-ts"
import { SharePanel } from "./components/SharePanel"

type TabName = "HTML" | "JIIX" | "Shapes" | "Messages"

export default function App()
{
  const [editor, setEditor] = useState<Editor>()
  const [recognizer, setRecognizer] = useState<Recognizer>()
  const [loading, setLoading] = useState<boolean>(true)
  const [tabName, setTabName] = useState<TabName>("HTML")
  const [leftColumnWidthPercent, setLeftColumnWidthPercent] = useState<number>(60)
  const [cachedShapes, setCachedShapes] = useState<object>({})

  const [serverConfiguration, setServerConfiguration] = useState<PartialDeep<TServerWebsocketConfiguration>>()
  const exports = useSelector((state: RootState) => state.exports.value)
  const errors = useSelector((state: RootState) => state.errors.value)
  const dispatch = useDispatch()
  const converter = useConverter()

  const batchedChangesRef = useRef<{
    added: Map<string, TLDrawShape>,
    updated: Map<string, { prev: TLRecord, current: TLDrawShape }>,
    removed: Map<string, TLDrawShape>
  }>({
    added: new Map(),
    updated: new Map(),
    removed: new Map()
  })
  const UPD_SHAPE_TAB_DELAY = 250
  const UPD_EXPORTS_TABS_DELAY = 500
  const SYNC_BATCH_DELAY = 200
  const AUTO_CONVERT_DELAY = 500

  const loadRecognizer = async (serverConfig: PartialDeep<TServerWebsocketConfiguration>) =>
  {
    try {
      setLoading(true)
      await Recognizer.instance?.destroy()
      setRecognizer(await useRecognizer(serverConfig!))
    } catch (error) {
      dispatch(addError(typeof error === "string" ? error as string : (error as Error).message))
    }
    setLoading(false)
  }

  const updateShapesDisplayDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const updateShapesDisplay = useCallback(() =>
  {
    if (!editor) return
    clearTimeout(updateShapesDisplayDebounceRef.current)
    updateShapesDisplayDebounceRef.current = setTimeout(() =>
    {
      setCachedShapes(editor.getCurrentPageShapes() as object)
    }, UPD_SHAPE_TAB_DELAY)
  }, [editor])

  const convertDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const scheduleConversion = useCallback((changedDrawShapes: TLDrawShape[]) =>
  {
    clearTimeout(convertDebounceRef.current)
    convertDebounceRef.current = setTimeout(() =>
    {
      if (changedDrawShapes.length > 0 && editor) {
        const { toConvert, toRemove } = converter.convert(changedDrawShapes)
        if (toConvert.length > 0) {
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
      .then(() =>
      {
        if (converter.auto && shapesToConvert.length > 0) {
          scheduleConversion(shapesToConvert)
        }
        updateShapesDisplay()
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
      const exports = await recognizer!.export(["application/vnd.myscript.jiix", "text/html"])
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
  }, [editor, recognizer, updateShapesDisplay, scheduleSyncBatch])

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
  }, [editor, recognizer, updateShapesDisplay, scheduleSyncBatch])

  const onShapeRemoved = useCallback(async (shape: TLRecord) =>
  {
    if (!editor || !recognizer) return

    if (shape.typeName !== "shape" || shape.type !== "draw") return
    const drawShape = shape as TLDrawShape

    batchedChangesRef.current.removed.set(drawShape.id, drawShape)

    batchedChangesRef.current.added.delete(drawShape.id)
    batchedChangesRef.current.updated.delete(drawShape.id)

    scheduleSyncBatch()
  }, [editor, recognizer, updateShapesDisplay, scheduleSyncBatch])

  const onTLdrawMounted = useCallback((editor: Editor) =>
  {
    setEditor(editor)
    editor.setCurrentTool("draw")
  }, [])

  const initResizeColumns = () =>
  {
    const resizeColumns = (e: PointerEvent) => setLeftColumnWidthPercent(e.clientX / window.innerWidth * 100)
    document.body.addEventListener("pointermove", resizeColumns)
    document.body.addEventListener("pointerup", () => document.body.removeEventListener("pointermove", resizeColumns))
  }

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
    if (!Recognizer.instance?.initialized && serverConfiguration) {
      loadRecognizer(serverConfiguration)
    }
  }, [Recognizer.instance?.initialized, serverConfiguration])

  if (!serverConfiguration) {
    if (!window.localStorage.getItem("server")) {
      return <KeyForms onSubmit={(keys) =>
      {
        const serverKeys = JSON.stringify(keys)
        window.localStorage.setItem("server", serverKeys)
        setServerConfiguration(keys as PartialDeep<TServerWebsocketConfiguration>)
      }} />
    }
    else {
      setServerConfiguration(JSON.parse(window.localStorage.getItem("server")!) as PartialDeep<TServerWebsocketConfiguration>)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%"
      }}
    >
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
      <div
        style={{
          width: `${ leftColumnWidthPercent }%`,
          height: "100%"
        }}
      >
        <Loading loading={loading} />
        <Tldraw
          components={{
            MainMenu,
            QuickActions,
            ContextMenu,
            SharePanel: (props) => <SharePanel {...props} loadRecognizer={loadRecognizer} />,
            PageMenu: null
          }}
          onMount={onTLdrawMounted}
        />
      </div>
      <div
        style={{
          width: `${ 100 - leftColumnWidthPercent }%`,
          height: "100%",
          display: "flex",
        }}
      >
        <div
          style={{
            width: "5px",
            background: "lightgrey",
            cursor: "ew-resize"
          }}
          onPointerDown={initResizeColumns}
        >
        </div>
        <div
          style={{
            width: "calc(100% - 5px)",
            padding: 12,
            background: "#eee",
            border: "none",
            overflow: "hidden"
          }}
        >
          <div className='tabs'>
            <button
              className={`tab-btn ${ tabName === "Shapes" ? "active" : "" }`}
              onClick={() => setTabName("Shapes")}
            >
              Shapes
            </button>
            <button
              className={`tab-btn ${ tabName === "JIIX" ? "active" : "" }`}
              onClick={() => setTabName("JIIX")}
            >
              Export JIIX
            </button>
            <button
              className={`tab-btn ${ tabName === "HTML" ? "active" : "" }`}
              onClick={() => setTabName("HTML")}
            >
              Export HTML
            </button>
            <button
              className={`tab-btn ${ tabName === "Messages" ? "active" : "" }`}
              onClick={() => setTabName("Messages")}
            >
              Messages
            </button>
          </div>
          <div
            style={{
              height: "calc(100% - 70px)",
              backgroundColor: "white",
              overflow: "scroll",
              padding: 12
            }}
          >
            <div id="shapes-tab-content" className={`tab-content ${ tabName === "Shapes" ? "active" : "" }`}>
              <ReactJson src={cachedShapes} collapsed={true} />
            </div>
            <div id="jiix-tab-content" className={`tab-content ${ tabName === "JIIX" ? "active" : "" }`}>
              <ReactJson src={exports["application/vnd.myscript.jiix"] as object} collapsed={true} />
            </div>
            <div id="html-tab-content" style={{ pointerEvents: "none" }} className={`tab-content ${ tabName === "HTML" ? "active" : "" }`}>
              {ExportHTMLTab(exports["text/html"] as string)}
            </div>
            <div id="messages-tab-content" className={`tab-content ${ tabName === "Messages" ? "active" : "" }`}>
              <ReactJson src={recognizer?.messages || []} collapsed={true} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
