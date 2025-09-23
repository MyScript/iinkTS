import
{
	DefaultMainMenu,
	DefaultMainMenuContent,
	TLDrawShape,
	TldrawUiMenuCheckboxItem,
	TldrawUiMenuGroup,
	TldrawUiMenuItem,
	useEditor,
} from 'tldraw'
import { useConverter } from "../Converter"
import { useSynchronizer } from '../Synchronizer'
import { useEffect, useState } from 'react'
import { useGestureManager } from '../GestureManager'

export function MainMenu()
{
	const editor = useEditor()
	const converter = useConverter()
	const synchronizer = useSynchronizer(editor)
	const gestureManager = useGestureManager(editor)
  const [processGesture, setProcessGesture] = useState(synchronizer.processGestures)
  const [onUnderlineChangeSize, setOnUnderlineChangeSize] = useState(gestureManager.onUnderline === "size")
  const [onStrikethroughEraseSize, setOnStrikethroughEraseSize] = useState(gestureManager.onStrikethrough === "erase")

	const OnConvert = () =>
	{
		const shapesToConvert = editor.getCurrentPageShapes().filter(s => s.type === "draw") as TLDrawShape[]
		const { toConvert, toRemove } = converter.convert(shapesToConvert)
		editor.run(() => {
			editor.deleteShapes(toRemove)
			editor.createShapes(toConvert)
		})
	}

	useEffect(() => {
		synchronizer.processGestures = processGesture
	}, [processGesture])

	useEffect(() => {
		gestureManager.onUnderline = onUnderlineChangeSize ? "size" : "draw"
	}, [onUnderlineChangeSize])

	useEffect(() => {
		gestureManager.onStrikethrough = onStrikethroughEraseSize ? "erase" : "draw"
	}, [onStrikethroughEraseSize])

	return (
		<DefaultMainMenu>
			<TldrawUiMenuGroup id="gesture-group" label={"Gesture"}>
				<TldrawUiMenuCheckboxItem
					id="gesture"
					checked={processGesture}
					label="Gesture enable"
					onSelect={() => setProcessGesture(!processGesture)}
				/>
				<TldrawUiMenuCheckboxItem
					id="on-underline"
					checked={onUnderlineChangeSize}
					label="Change size on underline (only draw shape)"
					onSelect={() => setOnUnderlineChangeSize(!onUnderlineChangeSize)}
				/>
				<TldrawUiMenuCheckboxItem
					id="on-strikethrough"
					checked={onStrikethroughEraseSize}
					label="Erase on strikethrough (only draw shape)"
					onSelect={() => setOnStrikethroughEraseSize(!onStrikethroughEraseSize)}
				/>
			</TldrawUiMenuGroup>
			<TldrawUiMenuGroup id="convert-group">
				<TldrawUiMenuItem
					id="convert"
					label="Convert"
					readonlyOk
					kbd="$c"
					onSelect={OnConvert}
				/>
			</TldrawUiMenuGroup>
			<DefaultMainMenuContent />
		</DefaultMainMenu>
	)
}
