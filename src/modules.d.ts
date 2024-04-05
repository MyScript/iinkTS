type JsonCSS = {
  toCSS(json): string
  toJSON(style): TTheme
}

declare module "*.css"

declare module "json-css"

declare module "*.svg"
