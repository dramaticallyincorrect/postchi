import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { copyProject, createProject, getDefaultProjectPath, Project } from "./lib/data/project/project";
import { isTauri } from "@tauri-apps/api/core";
import { MenuActions, onMenuEvent } from "./lib/menu/menu-events";
import { initMenu } from "./lib/menu/project-menu";
import { ImportDialog } from "./components/import-dialog";
import { NewProjectDialog } from "./components/new-project-dialog";
import { importPostmanCollection } from "./lib/data/import/import-folder";
import { importPostmanZip } from "./lib/data/import/import-postman-zip";
import { pathOf } from "./lib/data/files/join";
import { loadStore } from "./lib/data/store/store";
import { checkForUpdate } from "./lib/updater/updater";
import { UpdateDialog } from "./components/update-dialog";
import { Update } from "@tauri-apps/plugin-updater";
import { LicenseDialog } from "./components/license-dialog"
import { LicenseContext } from "./lib/license/license-context"
import { getInitialLicenseStatus, validateLicenseStatus } from "./lib/license/license";
import { AboutDialog } from "./about/about-dialog";
import { Toaster } from "@/components/ui/sonner";

const LAST_PROJECT_KEY = 'lastProjectPath'
const SETTINGS_STORE = 'settings.json'

const tempPath = await getDefaultProjectPath()

const store = await loadStore(SETTINGS_STORE)
const lastPath = await store.get<string>(LAST_PROJECT_KEY) ?? tempPath

const initialProject = await createProject(lastPath)
const initialLicenseStatus = await getInitialLicenseStatus()

await initMenu(lastPath === tempPath)

function AppShell() {
    const [project, setProject] = useState<Project>(initialProject)
    const [importOpen, setImportOpen] = useState(false)
    const [aboutOpen, setAboutOpen] = useState(false)
    const [newProjectOpen, setNewProjectOpen] = useState(false)
    const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null)
    const [licenseOpen, setLicenseOpen] = useState(false)
    const [isPro, setIsPro] = useState(initialLicenseStatus === 'pro')

    const refreshLicense = async () => {
        const status = await validateLicenseStatus()
        setIsPro(status === 'pro')
    }

    useEffect(() => {
        if (!isTauri()) return
        checkForUpdate().then(update => {
            if (update) setAvailableUpdate(update)
        }).catch(() => { })
    }, [])

    useEffect(() => {
        refreshLicense().catch(() => { })
    }, [])

    const switchProject = async (newProject: Project) => {
        const store = await loadStore(SETTINGS_STORE)
        await store.set(LAST_PROJECT_KEY, newProject.path)
        await store.save()
        setProject(newProject)
        await initMenu(newProject.path === tempPath)
    }

    useEffect(() => {
        const unlisten = onMenuEvent(async (action) => {
            switch (action) {
                case MenuActions.IMPORT_PROJECT:
                    setImportOpen(true)
                    break
                case MenuActions.NEW_PROJECT:
                    setNewProjectOpen(true)
                    break
                case MenuActions.OPEN_PROJECT: {
                    if (!isTauri()) break
                    const { open } = await import("@tauri-apps/plugin-dialog")
                    const selected = await open({ directory: true, title: "Open Project" })
                    if (typeof selected !== "string") break
                    await switchProject(await createProject(selected))
                    break
                }
                case MenuActions.CHECK_FOR_UPDATES: {
                    if (!isTauri()) break
                    const update = await checkForUpdate().catch(() => null)
                    if (update) {
                        setAvailableUpdate(update)
                    }
                    break
                }
                case MenuActions.ACTIVATE_LICENSE:
                    setLicenseOpen(true)
                    break
                case MenuActions.SAVE_PROJECT: {
                    const { open } = await import("@tauri-apps/plugin-dialog")
                    const selected = await open({ directory: true, title: "Save Project To…" })
                    if (typeof selected !== "string") break
                    await switchProject(await copyProject(project, selected))
                    break
                }
                case MenuActions.ABOUT_POSTCHI:
                    setAboutOpen(true)
                    break
            }
        })

        return unlisten
    }, [project])

    return (
        <LicenseContext.Provider value={{ isPro, openLicenseDialog: () => setLicenseOpen(true), refreshLicense }}>
            <App key={project.path} project={project} isTemp={project.path === tempPath} />
            <ImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                onImport={async (format, file) => {
                    if (format === 'postman') {
                        if (file.name.endsWith('.zip')) {
                            return importPostmanZip(file, project.collectionsPath)
                        }
                        return importPostmanCollection(file, project.collectionsPath)
                    }
                    return { count: 0, skipped: 0 }
                }}
            />
            <NewProjectDialog
                open={newProjectOpen}
                onOpenChange={setNewProjectOpen}
                onConfirm={async (name, parentFolder) => {
                    setNewProjectOpen(false)
                    const destPath = pathOf(parentFolder, name)
                    const newProject = await createProject(destPath)
                    await switchProject(newProject)
                }}
            />
            <UpdateDialog
                update={availableUpdate}
                onClose={() => setAvailableUpdate(null)}
            />
            <LicenseDialog
                open={licenseOpen}
                onOpenChange={setLicenseOpen}
                onActivated={async () => {
                    setIsPro(true)
                    setLicenseOpen(false)
                }}
            />
            <AboutDialog
                open={aboutOpen}
                onOpenChange={setAboutOpen}
            />
            <Toaster />
        </LicenseContext.Provider>
    )
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <AppShell />
    </React.StrictMode>,
);
