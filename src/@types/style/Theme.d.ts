import { TPenStyle } from "./PenStyle"

export type TMathTheme = {
  'font-family': string
}

export type TMathSolvedTheme = {
  'font-family': string
  color: string
}

export type TTextTheme = {
  'font-family': string,
  'font-size': number
}

export type TTheme = {
  ink: TPenStyle
  '.math': TMathTheme
  '.math-solved': TMathSolvedTheme
  '.text': TTextTheme
  [key: string]: unknown
}