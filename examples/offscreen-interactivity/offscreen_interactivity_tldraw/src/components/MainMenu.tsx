import
{
	DefaultMainMenu,
	DefaultMainMenuContent,
	TLDrawShape,
	TldrawUiMenuGroup,
	TldrawUiMenuItem,
	useEditor,
} from 'tldraw'
import { useConverter } from "../Converter"

export function MainMenu()
{
	const editor = useEditor()
	const converter = useConverter()

	const OnConvert = () =>
	{
		const shapesToConvert = editor.getCurrentPageShapes().filter(s => s.type === "draw") as TLDrawShape[]
		const { toConvert, toRemove } = converter.convert(shapesToConvert)
		editor.deleteShapes(toRemove)
		editor.createShapes(toConvert)
	}

	return (
		<DefaultMainMenu>
			<TldrawUiMenuGroup id="example">
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
