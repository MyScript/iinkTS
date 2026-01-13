# Environment setup

## Configure project

1. Download sources
2. Install dependencies.
    * `npm install`
3. Build the project using our npm script.
    * `npm run build`
4. Run the server and the live reload using our npm script.
    * `npm run dev`. Examples will be available on `http://localhost:8000/examples/index.html`

**Start coding**

5. Debug using your favorite browser dev tools. The sources will be available under the webpack source folder (for chrome dev tools). Every change in sources will trigger a rebuild with linter and basic tests.

**Prefix Helper**

* **T**: correspond to TypeScript type (ex: TInkEditorConfiguration, TStyle...)
* **I**: correspond to Ink with RecognizerHTTPV2 (IWriterManager, IModel, IHistoryManager...)
* **II**: correspond to Interactive Ink with RecognizerWebsocket (IIModek, IIHistoryManager, IITextManager...)
* **InteractiveInkSSR**: correspond to Interactive Ink Server Side Rengering with RecognizerWebsocketSSR