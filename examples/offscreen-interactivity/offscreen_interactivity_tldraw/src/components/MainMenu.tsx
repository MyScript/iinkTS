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
import { useRecognizer } from '../Recognizer'
import { useEffect, useState } from 'react'
export function MainMenu()
{
	const editor = useEditor()
	const converter = useConverter()
  const [processGesture, setProcessGesture] = useState(true)

	const OnConvert = () =>
	{
		const shapesToConvert = editor.getCurrentPageShapes().filter(s => s.type === "draw") as TLDrawShape[]
		const { toConvert, toRemove } = converter.convert(shapesToConvert)
		editor.batch(() => {
			editor.deleteShapes(toRemove)
			editor.createShapes(toConvert)
		})
	}
	const toggleGestureActivation = async () =>
	{
		setProcessGesture(!processGesture)
		const synchronizer = useSynchronizer(editor)
		synchronizer.processGestures = processGesture
		console.log('processGesture: ', processGesture);
		console.log('synchronizer.processGestures: ', synchronizer.processGestures);
	}

	useEffect(() => {

	}, [processGesture])

	return (
		<DefaultMainMenu>
			<TldrawUiMenuGroup id="example">
				<TldrawUiMenuCheckboxItem
					id="gesture"
					checked={processGesture}
					label="Gesture"
					onSelect={toggleGestureActivation}
				/>
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
