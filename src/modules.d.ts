type JsonCSS = {
  toCSS(json): string
  toJSON(style): TTheme
}

declare module "*.css"

declare module "json-css"

declare module "crypto-js/enc-hex"

declare module "crypto-js/hmac-sha512"

declare module "*.svg"
