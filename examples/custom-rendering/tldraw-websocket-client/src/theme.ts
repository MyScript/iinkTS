import { useCallback, useEffect, useState } from "react"

export type TTheme = "light" | "dark"

// Same storage key and attribute as the other examples (assets/js/theme.js): the choice follows the user across them
const STORAGE_KEY = "theme"

const readTheme = (): TTheme =>
{
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export const useTheme = (): [TTheme, () => void] =>
{
  const [theme, setTheme] = useState<TTheme>(readTheme)

  useEffect(() =>
  {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(previous =>
  {
    const next = previous === "dark" ? "light" : "dark"
    window.localStorage.setItem(STORAGE_KEY, next)
    return next
  }), [])

  return [theme, toggleTheme]
}
