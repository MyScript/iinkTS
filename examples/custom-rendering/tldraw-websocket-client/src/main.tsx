// Shared with the other examples: same header, side panels and theme
import "../../../assets/style/reset.css"
import "../../../assets/style/examples.css"
import "../../../assets/style/panel.css"
import "./index.css"
import React from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"

import App from "./App.tsx"
import { store } from "./store/index.ts"

const rootElement = createRoot(document.getElementById("root") as HTMLElement)

rootElement.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
