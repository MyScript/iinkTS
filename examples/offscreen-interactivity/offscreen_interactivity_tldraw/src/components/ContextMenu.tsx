import
{
	DefaultContextMenu,
	DefaultContextMenuContent,
	TLDrawShape,
	TldrawUiMenuGroup,
	TldrawUiMenuItem,
	useEditor,
} from 'tldraw'
import { useConverter } from '../Converter'

export function ContextMenu()
{
	const editor = useEditor()
	const converter = useConverter()

	const OnConvert = () =>
	{
		const shapesToConvert = editor.getSelectedShapes().filter(s => s.type === "draw") as TLDrawShape[]
		console.log('shapesToConvert: ', shapesToConvert)
		const { toConvert, toRemove } = converter.convert(shapesToConvert)
		console.log('toRemove: ', toRemove)
		if (toRemove.length) {
			editor.deleteShapes(toRemove)
		}
		if (toConvert.length) {
			editor.createShapes(toConvert)
		}
	}

	return (
		<DefaultContextMenu>
			<TldrawUiMenuGroup id="example">
				<TldrawUiMenuItem
					id="convert-selection"
					label="Convert"
					readonlyOk
					onSelect={OnConvert}
				/>
			</TldrawUiMenuGroup>
			<DefaultContextMenuContent />
		</DefaultContextMenu>
	)
}
