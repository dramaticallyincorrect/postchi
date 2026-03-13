import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { createProject, Project } from "./lib/data/project/project";
import { isTauri } from "@tauri-apps/api/core";
import { useImportDialog } from "./lib/hooks/use-import-dialog";
import { initMenu } from "./lib/menu/project-menu";
import { ImportDialog } from "./components/import-dialog";
import { importPostmanCollection } from "./lib/data/import/import-folder";
import { FileStorage } from "./lib/data/files/file";
import DefaultFileStorage from "./lib/data/files/file-default";
import { pathOf } from "./lib/data/files/join";


async function getDefaultProjectPath(): Promise<string> {
  if (isTauri()) {
    const { appDataDir } = await import('@tauri-apps/api/path')
    return `${await appDataDir()}/postchi-project`
  }
  return '/tmp/postchi-project'
}


const project = await createTestProject(await getDefaultProjectPath(), 'Content Service')

await initMenu();

function AppShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useImportDialog();

  return (
    <>
      {children}
      <ImportDialog open={open} onOpenChange={setOpen} onImport={async (format, file) => {
        if (format === 'postman') {
          return importPostmanCollection(file, project.collectionsPath)
        }
        return { count: 0, skipped: 0 }
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


export async function createTestProject(path: string, name: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<Project> {
  const project = await createProject(path, name)
  await fileStorage.create(pathOf(project.collectionsPath, 'settings.json'), `{"baseUrl": "https://httpbin.org"}`)
  await fileStorage.mkdir(pathOf(project.collectionsPath, 'top', 'nested', 'deep', 'down'))
  await fileStorage.create(pathOf(project.collectionsPath, 'users.get'), `POST https://httpbin.org/post
User-Agent: <user-agent>
Accept: application/json
Authorization: bearer(<token>)
@body
{
  "username": "<username>"
}`)
  await fileStorage.create(pathOf(project.collectionsPath, 'auth.get'), 'GET https://httpbin.org/get')
  return project
}