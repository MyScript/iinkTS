# Environment setup

## Configure project

Requires Node.js >= 22.

1. Download sources
2. Install yarn 4 via Corepack (bundled with Node.js).
    * `corepack enable`
    * `corepack install` (reads the `packageManager` field in `package.json` and installs the pinned yarn version)
3. Install dependencies.
    * `yarn install`
4. Build the library using our yarn script.
    * `yarn build:lib`
    * `yarn build` runs the whole chain (lint, typecheck, unit tests, library, docs, tldraw and Excalidraw examples); run `yarn setup:examples` once before it, to install the two custom-rendering examples
5. Put your credentials in `.env.local` (`HOST`, `APPLICATION_KEY`, `HMAC_KEY`, optional `SCHEME`): `yarn dev` loads them into the examples on localhost. Or use a local backend with `yarn dev:backend` (Docker).
6. Run the server and the live reload using our yarn script.
    * `yarn dev`. Examples will be available on `http://localhost:8000/examples/index.html`

**Start coding**

7. Debug using your favorite browser dev tools. `yarn dev` builds with source maps, the TypeScript sources show under `src/`. Every change in sources triggers a rebuild and reloads the page; lint and tests are not run, use the commands below.

**Useful commands**

* `yarn lint` — lint sources and tests
* `yarn typecheck` — type check sources and tests
* `yarn test:unit` — run unit tests (Jest)
* `yarn test:examples` — run end-to-end tests (Playwright); `yarn test:examples:docker` runs them in Docker like the CI
* `yarn build:docs` — generate API documentation (TypeDoc)

**Prefix Helper**

* **T**: correspond to TypeScript type (ex: TInkCanvasConfiguration, TStyle...)
* **I**: correspond to Ink with HTTPClientV2 (IWriterManager, IModel, IHistoryManager...)
* **II**: correspond to Interactive Ink with WebSocketClient (IIModel, IIHistoryManager, IITypesetManager...)
* **InteractiveInkSSR**: correspond to Interactive Ink Server Side Rendering with WebSocketSSRClient
