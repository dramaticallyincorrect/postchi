import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { createProject } from "./lib/data/project/project";
import { isTauri } from "@tauri-apps/api/core";


async function getDefaultProjectPath(): Promise<string> {
  if (isTauri()) {
    const { appDataDir } = await import('@tauri-apps/api/path')
    return `${await appDataDir()}/postchi-project`
  }
  return '/tmp/postchi-project'
}


const project = await createProject(await getDefaultProjectPath(), 'Content Service')

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App project={project} />
  </React.StrictMode>,
);
