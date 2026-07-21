import { TldrawUiButton, TldrawUiButtonLabel } from "tldraw"
import { useConverter } from "../Converter"
import { useState } from "react"

export function TopZone() {
  const converter = useConverter()

  const [activeAutoConvert, setActiveAutoConvert] = useState(converter.auto)

  const onActiveAutoConvert = () => {
    converter.auto = !activeAutoConvert
    setActiveAutoConvert(converter.auto)
  }

	return (
    <TldrawUiButton
      type="primary"
      style={{ backgroundColor: activeAutoConvert ? "#4caf50" : "#4caf5075", color: "white", borderRadius: "4px", padding: "8px 16px" }}
      onClick={onActiveAutoConvert}
    >
      <TldrawUiButtonLabel>Auto conversion {activeAutoConvert ? "activée" : "désactivée"}</TldrawUiButtonLabel>
    </TldrawUiButton>
	)
}
