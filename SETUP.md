# Environment setup

## Configure project

Requires Node.js >= 22.

1. Download sources
2. Install yarn 4 via Corepack (bundled with Node.js).
    * `corepack enable`
    * `corepack install` (reads the `packageManager` field in `package.json` and installs the pinned yarn version)
3. Install dependencies.
    * `yarn install`
4. Build the project using our yarn script.
    * `yarn build`
5. Run the server and the live reload using our yarn script.
    * `yarn dev`. Examples will be available on `http://localhost:8000/examples/index.html`

**Start coding**

6. Debug using your favorite browser dev tools. The sources will be available under the webpack source folder (for chrome dev tools). Every change in sources will trigger a rebuild with linter and basic tests.

**Useful commands**

* `yarn lint` — lint sources
* `yarn test:unit` — run unit tests (Jest)
* `yarn test:examples` — run end-to-end tests (Playwright)
* `yarn build:docs` — generate API documentation (TypeDoc)

**Prefix Helper**

* **T**: correspond to TypeScript type (ex: TInkEditorConfiguration, TStyle...)
* **I**: correspond to Ink with RecognizerHTTPV2 (IWriterManager, IModel, IHistoryManager...)
* **II**: correspond to Interactive Ink with RecognizerWebsocket (IIModek, IIHistoryManager, IITextManager...)
* **InteractiveInkSSR**: correspond to Interactive Ink Server Side Rendering with RecognizerWebsocketSSR
