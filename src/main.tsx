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
import { SettingsDialog } from "./components/settings-dialog";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "posthog-js/react";
import { TooltipProvider } from "./components/ui/tooltip";
import { setActiveProject } from "./lib/project-state";
import { ThemeProvider } from "./theme-context/theme-context";

const LAST_PROJECT_KEY = 'lastProjectPath'
const SETTINGS_STORE = 'settings.json'

const options = {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    autocapture: false,
} as const

const tempPath = await getDefaultProjectPath()

const store = await loadStore(SETTINGS_STORE)
const lastPath = await store.get<string>(LAST_PROJECT_KEY) ?? tempPath

const initialProject = await createProject(lastPath)

setActiveProject(initialProject)

const initialLicenseStatus = await getInitialLicenseStatus()

await initMenu(lastPath === tempPath)

function AppShell() {
    const [project, setProject] = useState<Project>(initialProject)
    const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null)
    const [isPro, setIsPro] = useState(initialLicenseStatus === 'pro')

    const refreshLicense = async () => {
        const status = await validateLicenseStatus()
        setIsPro(status === 'pro')
    }

    useEffect(() => {
        setActiveProject(project)
    }, [project])

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
                case MenuActions.SAVE_PROJECT: {
                    const { open } = await import("@tauri-apps/plugin-dialog")
                    const selected = await open({ directory: true, title: "Save Project To…" })
                    if (typeof selected !== "string") break
                    await switchProject(await copyProject(project, selected))
                    break
                }
            }
        })

        return unlisten
    }, [project])

    return (
        <LicenseContext.Provider value={{ isPro, refreshLicense }}>
            <App key={project.path} project={project} isTemp={project.path === tempPath} />
            <ImportDialog
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
                onConfirm={async (name, parentFolder) => {
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
                onActivated={async () => {
                    setIsPro(true)
                }}
            />
            <AboutDialog />
            <SettingsDialog />
            <Toaster />
        </LicenseContext.Provider>
    )
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider>
            <TooltipProvider>
                <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN} options={options}>
                    <AppShell />
                </PostHogProvider>
            </TooltipProvider>
        </ThemeProvider>

    </React.StrictMode>,
);
