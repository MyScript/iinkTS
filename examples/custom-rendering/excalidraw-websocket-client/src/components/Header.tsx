import { TTheme } from "../theme"

export type TPanelToggle = {
  label: string
  controls: string
  open: boolean
  onToggle: () => void
}

type THeaderProps = {
  title: string
  panels: TPanelToggle[]
  onShowKeys: () => void
  theme: TTheme
  onToggleTheme: () => void
}

/**
 * Same header as the other examples: panel toggles (shown on small screens), API keys, title, theme
 */
export function Header({ title, panels, onShowKeys, theme, onToggleTheme }: THeaderProps)
{
  return (
    <header className="header-main">
      {panels.map(panel => (
        <button
          key={panel.controls}
          className="btn-panel-toggle"
          aria-expanded={panel.open}
          aria-controls={panel.controls}
          onClick={panel.onToggle}
        >
          {panel.label}
        </button>
      ))}
      <button className="btn-keys" onClick={onShowKeys}>API Keys</button>
      <h1 className="header-title">{title}</h1>
      <button className="ex-theme-toggle" aria-label="Toggle dark mode" onClick={onToggleTheme}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  )
}
