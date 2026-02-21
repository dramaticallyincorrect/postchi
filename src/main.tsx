import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { themes } from "./lib/theme/themes";
import { applyThemeToCSSVars } from "./lib/theme/theme-builder";

applyThemeToCSSVars(themes[0]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
