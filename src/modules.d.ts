type TJsonCSS = {
  toCSS(json): string
  toJSON(style): TTheme
}

declare module "*.css"

declare module "json-css"

declare module "*.svg"

declare module "web-worker:*" {
  const WorkerFactory: new () => Worker
  export default WorkerFactory
}

/**
 * The library's version, `package.json#version`. Rollup replaces it at build time and Jest
 * defines it in `globals`: no source file carries the version itself.
 */
declare const __IINK_VERSION__: string
