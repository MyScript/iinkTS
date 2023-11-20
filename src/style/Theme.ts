import { TPenStyle } from "./PenStyle"

/**
 * @group Style
 */
export type TThemeMath = {
  "font-family": string
}

/**
 * @group Style
 */
export type TThemeMathSolved = {
  "font-family": string
  color: string
}

/**
 * @group Style
 */
export type TThemeText = {
  "font-family": string,
  "font-size": number
}

/**
 * @group Style
 */
export type TTheme = {
  ink: TPenStyle
  ".math": TThemeMath
  ".math-solved": TThemeMathSolved
  ".text": TThemeText
  [key: string]: unknown
}

/**
 * @group Style
 */
export const DefaultTheme: TTheme = {
  ink: {
    color: "#000000",
    width: 1,
    "-myscript-pen-width": 1,
    "-myscript-pen-fill-style": "none",
    "-myscript-pen-fill-color": "#FFFFFF00"
  },
  ".math": {
    "font-family": "STIXGeneral"
  },
  ".math-solved": {
    "font-family": "STIXGeneral",
    color: "#A8A8A8FF"
  },
  ".text": {
    "font-family": "MyScriptInter",
    "font-size": 10
  }
}
