import { TTheme } from "../@types/style/Theme"

export const DefaultTheme: TTheme = {
  ink: {
    color: '#000000',
    width: 1,
    '-myscript-pen-width': 1,
    '-myscript-pen-fill-style': 'none',
    '-myscript-pen-fill-color': '#FFFFFF00'
  },
  '.math': {
    'font-family': 'STIXGeneral'
  },
  '.math-solved': {
    'font-family': 'STIXGeneral',
    color: '#A8A8A8FF'
  },
  '.text': {
    'font-family': 'MyScriptInter',
    'font-size': 10
  }
}
