import
{
	DefaultContextMenu,
	DefaultContextMenuContent,
	TLDrawShape,
	TldrawUiMenuGroup,
	TldrawUiMenuItem,
	useEditor,
} from "tldraw"
import { useConverter } from "../Converter"

export function ContextMenu()
{
	const editor = useEditor()
	const converter = useConverter()

	const OnConvert = () =>
	{
    const shapesToConvert = editor.getCurrentPageShapes().filter(s => s.type === "draw") as TLDrawShape[]
    if (!shapesToConvert?.length) return

		const { toConvert, toRemove } = converter.convert(shapesToConvert)
		// Own undo step: otherwise undo also removes the last stroke drawn
		editor.markHistoryStoppingPoint("convert")
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
