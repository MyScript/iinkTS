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
import { useEffect, useState } from 'react'

export function ContextMenu()
{
	const [shapesToConvert, setShapesToConvert] = useState<TLDrawShape[]>([])
	const editor = useEditor()
	const converter = useConverter()

	const OnConvert = () =>
	{
		const { toConvert, toRemove } = converter.convert(shapesToConvert)
		if (toRemove.length) {
			editor.deleteShapes(toRemove)
		}
		if (toConvert.length) {
			editor.createShapes(toConvert)
		}
	}


	editor.on("update", (b) =>
	{
		setShapesToConvert(editor.getSelectedShapes().filter(s => s.type === "draw") as TLDrawShape[])
	}, editor)

	if (shapesToConvert.length) {
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
	else {
		return (
			<DefaultContextMenu>
				<DefaultContextMenuContent />
			</DefaultContextMenu>
		)
	}

}
