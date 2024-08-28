type JsonCSS = {
  toCSS(json): string
  toJSON(style): TTheme
}

declare module "*.css"

declare module "json-css"

declare module "*.svg"

declare module "web-worker:*" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
