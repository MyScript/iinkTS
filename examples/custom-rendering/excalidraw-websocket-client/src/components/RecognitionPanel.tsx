import type { TJIIXElement, TJIIXExport } from "iink-ts"

const describe = (element: TJIIXElement): string =>
{
  if ("label" in element && element.label) return element.label
  if ("kind" in element && element.kind) return element.kind
  return ""
}

type TRecognitionPanelProps = {
  jiix?: TJIIXExport
  /** Called with the hovered element, then with nothing once the pointer leaves it */
  onHover?: (element?: TJIIXElement) => void
}

/**
 * What the server recognized in the scene: one line per JIIX element, then the raw JIIX
 */
export function RecognitionPanel({ jiix, onHover }: TRecognitionPanelProps)
{
  const elements = jiix?.elements ?? []
  return (
    <>
      <p className="ex-panel-heading">Recognition</p>
      {elements.length === 0 && (
        <p className="ex-panel-intro">Write or draw on the canvas: what the server reads shows up here.</p>
      )}
      <ul id="recognition-elements" className="recognition-elements">
        {elements.map(element => (
          <li
            key={element.id}
            className="ex-panel-item"
            onPointerEnter={() => onHover?.(element)}
            onPointerLeave={() => onHover?.()}
          >
            <div className="ex-panel-item-label">{element.type}</div>
            <div className="ex-panel-item-desc">{describe(element)}</div>
          </li>
        ))}
      </ul>
      {jiix && (
        <>
          <div className="ex-panel-divider"></div>
          <p className="ex-panel-heading">JIIX</p>
          <pre id="recognition-jiix" className="ex-panel-code recognition-jiix">
            {JSON.stringify(jiix, null, 2)}
          </pre>
        </>
      )}
    </>
  )
}
