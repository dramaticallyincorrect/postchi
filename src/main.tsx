import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { themes } from "./lib/theme/themes";
import { applyThemeToCSSVars } from "./lib/theme/theme-builder";

// main.tsx
function applyTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', prefersDark)
}

// Apply on load
// applyTheme()

// Also update if the user changes their system theme while the app is open
// window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)

applyThemeToCSSVars(themes[0]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
