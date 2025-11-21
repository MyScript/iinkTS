import { useCallback, useEffect, useState, } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ReactJson from 'react-json-view'
import { Editor, HistoryEntry, TLEventMapHandler, TLRecord, Tldraw, useDialogs } from 'tldraw'
import { RootState } from './store'
import { setExports } from './store/exportsStore'
import { addError, removeError } from './store/errorsStore'

import { Recognizer, useRecognizer } from './Recognizer'
import { useSynchronizer } from './Synchronizer'

import { Loading } from './components/Loading'

import { ExportHTMLTab } from './components/ExportHTMLTab'
import { MainMenu } from './components/MainMenu'
import { ContextMenu } from './components/ContextMenu'
import { Modal } from './components/Modal'
import { KeyForms } from './components/KeyForms'
import { PartialDeep, TServerWebsocketConfiguration } from 'iink-ts'

type TabName = 'HTML' | 'JIIX' | 'Shapes' | 'Messages'

export default function App()
{
  const [editor, setEditor] = useState<Editor>()
  const [recognizer, setRecognizer] = useState<Recognizer>()
  const [loading, setLoading] = useState<boolean>(true)
  const [tabName, setTabName] = useState<TabName>('HTML')
  const [leftColumnWidthPercent, setLeftColumnWidthPercent] = useState<number>(60)

  const [serverConfiguration, setServerConfiguration] = useState<PartialDeep<TServerWebsocketConfiguration>>()
  const exports = useSelector((state: RootState) => state.exports.value)
  const errors = useSelector((state: RootState) => state.errors.value)
  const dispatch = useDispatch()

  const loadRecognizer = async (serverConfig: PartialDeep<TServerWebsocketConfiguration>) =>
  {
    try {
      await Recognizer.instance?.destroy()
      setRecognizer(await useRecognizer(serverConfig!))
    } catch (error) {
      dispatch(addError(typeof error === "string" ? error as string : (error as Error).message))
    }
    setLoading(false)
  }

  const setAppToState = useCallback((editor: Editor) =>
  {
    setEditor(editor)
    editor.setCurrentTool("draw")
  }, [])

  let updateExportsDebounce: ReturnType<typeof setTimeout>
  const updateExports = async () =>
  {
    clearTimeout(updateExportsDebounce)
    updateExportsDebounce = setTimeout(async () =>
    {
      const exports = await recognizer!.export(['application/vnd.myscript.jiix', 'text/html'])
      dispatch(setExports(exports))
    }, 500)
  }

  useEffect(() =>
  {
    if (!editor || !recognizer) return
    recognizer.event.addContentChangedListener(updateExports)

    const handleChangeEvent: TLEventMapHandler<'change'> = async (change: HistoryEntry<TLRecord>) =>
    {
      if (change.source === 'user') {
        try {
          await useSynchronizer(editor).sync(change.changes)
        } catch (error) {
          dispatch(addError(typeof error === "string" ? error as string : (error as Error).message))
        }
      }
    }

    editor.on('change', handleChangeEvent)

    return () =>
    {
      editor.off('change', handleChangeEvent)
      recognizer.destroy()
    }
  }, [editor, recognizer])

  useEffect(() =>
  {
    if (!Recognizer.instance?.initialized && serverConfiguration) {
      loadRecognizer(serverConfiguration)
    }
  }, [Recognizer.instance?.initialized, serverConfiguration])

  const initResizeColumns = () =>
  {
    const resizeColumns = (e: PointerEvent) => setLeftColumnWidthPercent(e.clientX / window.innerWidth * 100)
    document.body.addEventListener('pointermove', resizeColumns)
    document.body.addEventListener('pointerup', () => document.body.removeEventListener('pointermove', resizeColumns))
  }

  if(!serverConfiguration) {
    if(!window.localStorage.getItem("server")) {
      return <KeyForms onSubmit={(keys) => {
        const serverKeys = JSON.stringify(keys)
        window.localStorage.setItem("server", serverKeys)
        setServerConfiguration(keys as PartialDeep<TServerWebsocketConfiguration>)
      }} />
    }
    else
    {
      setServerConfiguration(JSON.parse(window.localStorage.getItem("server")!) as PartialDeep<TServerWebsocketConfiguration>)
    }
  }
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
          onSubmit={async (keys) => {
            localStorage.setItem("server", JSON.stringify(keys))
            await loadRecognizer(keys as PartialDeep<TServerWebsocketConfiguration>)
            onClose()
          }}
        />
    </div>
  )
}

const CustomSharePanel = () => {
	const { addDialog } = useDialogs()

	return (
		<div style={{ padding: 16, gap: 16, display: 'flex', pointerEvents: 'all' }}>
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
  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%'
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
          height: '100%'
        }}
      >
        <Loading loading={loading} />
        <Tldraw
          components={{
            MainMenu,
            ContextMenu,
            SharePanel: CustomSharePanel,
            PageMenu: null
          }}
          onMount={setAppToState}
        />
      </div>
      <div
        style={{
          width: `${ 100 - leftColumnWidthPercent }%`,
          height: '100%',
          display: 'flex',
        }}
      >
        <div
          style={{
            width: '5px',
            background: 'lightgrey',
            cursor: 'ew-resize'
          }}
          onPointerDown={initResizeColumns}
        >
        </div>
        <div
          style={{
            width: 'calc(100% - 5px)',
            padding: 12,
            background: '#eee',
            border: 'none',
            overflow: 'hidden'
          }}
        >
          <div className='tabs'>
            <button
              className={`tab-btn ${ tabName === 'Shapes' ? 'active' : '' }`}
              onClick={() => setTabName('Shapes')}
            >
              Shapes
            </button>
            <button
              className={`tab-btn ${ tabName === 'JIIX' ? 'active' : '' }`}
              onClick={() => setTabName('JIIX')}
            >
              Export JIIX
            </button>
            <button
              className={`tab-btn ${ tabName === 'HTML' ? 'active' : '' }`}
              onClick={() => setTabName('HTML')}
            >
              Export HTML
            </button>
            <button
              className={`tab-btn ${ tabName === 'Messages' ? 'active' : '' }`}
              onClick={() => setTabName('Messages')}
            >
              Messages
            </button>
          </div>
          <div
            style={{
              height: 'calc(100% - 70px)',
              backgroundColor: 'white',
              overflow: 'scroll',
              padding: 12
            }}
          >
            <div id="shapes-tab-content" className={`tab-content ${ tabName === "Shapes" ? "active" : "" }`}>
              <ReactJson src={editor?.getCurrentPageShapes() as object} collapsed={true} />
            </div>
            <div id="jiix-tab-content" className={`tab-content ${ tabName === "JIIX" ? "active" : "" }`}>
              <ReactJson src={exports['application/vnd.myscript.jiix'] as object} collapsed={true} />
            </div>
            <div id="html-tab-content" style={{ pointerEvents: 'none' }} className={`tab-content ${ tabName === "HTML" ? "active" : "" }`}>
              {ExportHTMLTab(exports['text/html'] as string)}
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
