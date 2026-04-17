import { DefaultQuickActions, DefaultQuickActionsContent, TldrawUiButton, TldrawUiButtonLabel } from "tldraw"
import { useConverter } from "../Converter"
import { useState } from "react"

export function QuickActions() {
  const converter = useConverter()

  const [activeAutoConvert, setActiveAutoConvert] = useState(converter.auto)

  const onActiveAutoConvert = () => {
    converter.auto = !activeAutoConvert
    setActiveAutoConvert(converter.auto)
  }

	return (
		<DefaultQuickActions>
			<DefaultQuickActionsContent />
        <TldrawUiButton
					type="menu"
					onClick={onActiveAutoConvert}
				>
					<TldrawUiButtonLabel>Auto conversion {activeAutoConvert ? "activée" : "désactivée"}</TldrawUiButtonLabel>
				</TldrawUiButton>
		</DefaultQuickActions>
	)
}
