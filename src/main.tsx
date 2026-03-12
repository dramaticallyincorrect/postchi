import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { createProject } from "./lib/data/project/project";
import { isTauri } from "@tauri-apps/api/core";
import { useImportDialog } from "./lib/hooks/use-import-dialog";
import { initMenu } from "./lib/menu/project-menu";
import { ImportDialog } from "./components/import-dialog";
import { importPostmanCollection } from "./lib/data/import/import-folder";


async function getDefaultProjectPath(): Promise<string> {
  if (isTauri()) {
    const { appDataDir } = await import('@tauri-apps/api/path')
    return `${await appDataDir()}/postchi-project`
  }
  return '/tmp/postchi-project'
}


const project = await createProject(await getDefaultProjectPath(), 'Content Service')

await initMenu();

function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useImportDialog();

  return (
    <>
      {children}
      <ImportDialog open={open} onOpenChange={setOpen} onImport={async (format, file) => {
        if (format === 'postman') {
          importPostmanCollection(file, project.collectionsPath)
        }
      }} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppShell>
      <App project={project} />
    </AppShell>
  </React.StrictMode>,
);
