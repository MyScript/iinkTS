/**
 * Predefined editor themes — passed to `editor.setCssVars()`.
 * `vars: undefined` resets to the stylesheet defaults.
 * @group Canvas
 */
export type TCanvasTheme = {
  id: string
  label: string
  /** Representative accent color shown as a swatch in the picker */
  swatch: string
  /** Primary color used for labels and highlights */
  color: string
  vars: Record<string, string> | undefined
}

/** @group hidden */
const CANVAS_THEMES: TCanvasTheme[] = [
  {
    id: "default",
    label: "Default",
    swatch: "#ffffff",
    color: "#000000",
    vars: undefined,
  },
  {
    id: "dark",
    label: "Dark",
    swatch: "#1a1a1a",
    color: "#e2e2e2",
    vars: {
      "--ms-ink-primary": "#60a5fa",
      "--ms-ink-color": "#e2e2e2",
      "--ms-ink-canvas-bg": "#1a1a1a",
      "--ms-ink-surface": "#242424",
      "--ms-ink-guide-color": "#333333",
      "--ms-ink-text-muted": "#888888",
      "--ms-ink-menu-bg": "#141414",
      "--ms-ink-menu-title-bg": "#2c2c2c",
      "--ms-ink-menu-hover": "rgba(96, 165, 250, 0.12)",
      "--ms-ink-input-bg": "#1a1a1a",
      "--ms-ink-input-color": "#e2e2e2",
      "--ms-ink-input-border": "#333333",
      "--ms-ink-section-bg": "#1a1a1a",
      "--ms-ink-border-color": "#333333",
      "--ms-ink-secondary": "#6c6c6c",
      "--ms-ink-tertiary": "#242424",
      "--ms-ink-success": "#a6e3a1",
      "--ms-ink-warning": "#f9e2af",
      "--ms-ink-error": "#f38ba8",
      "--ms-ink-info": "#89dceb",
    },
  },
  {
    id: "sepia",
    label: "Sepia",
    swatch: "#f4ede0",
    color: "#3d2b1f",
    vars: {
      "--ms-ink-primary": "#8B5E3C",
      "--ms-ink-color": "#3d2b1f",
      "--ms-ink-canvas-bg": "#f4ede0",
      "--ms-ink-surface": "#ede0d0",
      "--ms-ink-guide-color": "#d4c4b0",
      "--ms-ink-text-muted": "#8c7b6b",
      "--ms-ink-menu-bg": "#fffcf5",
      "--ms-ink-menu-title-bg": "#e8d5bc",
      "--ms-ink-menu-hover": "rgba(139, 94, 60, 0.10)",
      "--ms-ink-input-bg": "#fffdf8",
      "--ms-ink-input-color": "#3d2b1f",
      "--ms-ink-input-border": "#c9b49a",
      "--ms-ink-section-bg": "#f0e8d8",
      "--ms-ink-border-color": "#d8c8b0",
      "--ms-ink-secondary": "#a08060",
      "--ms-ink-tertiary": "#e8d5bc",
      "--ms-ink-success": "#4a7c59",
      "--ms-ink-warning": "#c07820",
      "--ms-ink-error": "#b03a2e",
      "--ms-ink-info": "#2e6da4",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "#0a1628",
    color: "#a8d8ea",
    vars: {
      "--ms-ink-primary": "#00c9c8",
      "--ms-ink-color": "#a8d8ea",
      "--ms-ink-canvas-bg": "#0a1628",
      "--ms-ink-surface": "#0f2040",
      "--ms-ink-guide-color": "#1a3060",
      "--ms-ink-text-muted": "#4a7a9b",
      "--ms-ink-menu-bg": "#071220",
      "--ms-ink-menu-title-bg": "#0a2a4a",
      "--ms-ink-menu-hover": "rgba(0, 201, 200, 0.12)",
      "--ms-ink-input-bg": "#0a1628",
      "--ms-ink-input-color": "#a8d8ea",
      "--ms-ink-input-border": "#1a3060",
      "--ms-ink-section-bg": "#081018",
      "--ms-ink-border-color": "#1a3060",
      "--ms-ink-secondary": "#2a5a7a",
      "--ms-ink-tertiary": "#0f2040",
      "--ms-ink-success": "#00e5a0",
      "--ms-ink-warning": "#ffd060",
      "--ms-ink-error": "#ff6b8a",
      "--ms-ink-info": "#00b8d9",
    },
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "#f5f9f4",
    color: "#1a3320",
    vars: {
      "--ms-ink-primary": "#4caf6e",
      "--ms-ink-color": "#1a3320",
      "--ms-ink-canvas-bg": "#f5f9f4",
      "--ms-ink-surface": "#e8f2e6",
      "--ms-ink-guide-color": "#c8dfc4",
      "--ms-ink-text-muted": "#6a8c66",
      "--ms-ink-menu-bg": "#ffffff",
      "--ms-ink-menu-title-bg": "#c8e6c9",
      "--ms-ink-menu-hover": "rgba(76, 175, 110, 0.10)",
      "--ms-ink-input-bg": "#ffffff",
      "--ms-ink-input-color": "#1a3320",
      "--ms-ink-input-border": "#a5c8a0",
      "--ms-ink-section-bg": "#edf5eb",
      "--ms-ink-border-color": "#c5dfc0",
      "--ms-ink-secondary": "#7aaa76",
      "--ms-ink-tertiary": "#d8eed5",
      "--ms-ink-success": "#2e7d32",
      "--ms-ink-warning": "#f57f17",
      "--ms-ink-error": "#b71c1c",
      "--ms-ink-info": "#01579b",
    },
  },
]

/** @group Canvas */
export const THEME_STORAGE_KEY = "iink-editor-theme"

/** @group Canvas */
export class CanvasThemes {
  static EDITOR_THEMES = CANVAS_THEMES
  static THEME_STORAGE_KEY = THEME_STORAGE_KEY
  static getSavedThemeId(): string {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) ?? "default"
    } catch {
      return "default"
    }
  }
  static saveThemeId(id: string): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // ignore (private browsing)
    }
  }
  static getThemeById(id: string): TCanvasTheme {
    return CANVAS_THEMES.find((t) => t.id === id) ?? CANVAS_THEMES[0]
  }
}
