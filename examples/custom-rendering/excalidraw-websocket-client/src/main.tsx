import "@excalidraw/excalidraw/index.css"
// Shared with the other examples: same header, side panels and theme
import "../../../assets/style/reset.css"
import "../../../assets/style/examples.css"
import "../../../assets/style/panel.css"
import "./index.css"
import React from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"

const rootElement = createRoot(document.getElementById("root") as HTMLElement)

rootElement.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
