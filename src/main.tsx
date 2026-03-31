import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { isTauri } from "@tauri-apps/api/core";
import { MenuActions, onMenuEvent } from "./app/menu/menu-events";
import { initMenu } from "./app/menu/project-menu";
import { ImportData } from "./app/import/import-dialog";
import { NewProjectDialog } from "./app/project/new-project-dialog";
import { pathOf } from "./lib/storage/files/join";
import { loadStore } from "./lib/storage/store/store";
import { checkForUpdate } from "./app/updater/updater";
import { UpdateDialog } from "./app/updater/update-dialog";
import { Update } from "@tauri-apps/plugin-updater";
import { LicenseDialog } from "./app/license/license-dialog"
import { LicenseContext } from "./app/license/license-context"
import { AboutDialog } from "./app/about/about-dialog";
import { SettingsWindow } from "./app/settings/settings-window";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "posthog-js/react";
import { TooltipProvider } from "./components/ui/tooltip";
import { setActiveProject } from "./lib/project-state";
import { ThemeProvider } from "./app/theme/theme-context";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { openSettingsWindow } from "./app/windows/window-manager";
import { getInitialLicenseStatus, validateLicenseStatus } from "./postchi/license/license";
import { getDefaultProjectPath, createProject, copyProject, Project } from "./postchi/project/project";
import { applySourceChanges } from "./postchi/sources/source-applier";
import { PendingSourceChanges, checkSources } from "./postchi/sources/source-checker";

const LAST_PROJECT_KEY = 'lastProjectPath'
const SETTINGS_STORE = 'settings.json'

const options = {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    autocapture: false,
} as const

const windowLabel = isTauri() ? getCurrentWebviewWindow().label : 'main'

let tempPath = ''
let initialProject: Project | null = null
let initialLicenseStatus: Awaited<ReturnType<typeof getInitialLicenseStatus>> = 'free'

if (windowLabel === 'main') {
    tempPath = await getDefaultProjectPath()

    const store = await loadStore(SETTINGS_STORE)
    const lastPath = await store.get<string>(LAST_PROJECT_KEY) ?? tempPath

    initialProject = await createProject(lastPath)

    setActiveProject(initialProject)

    initialLicenseStatus = await getInitialLicenseStatus()

    await initMenu(lastPath === tempPath)
}

function AppShell() {
    const [project, setProject] = useState<Project>(initialProject!)
    const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null)
    const [isPro, setIsPro] = useState(initialLicenseStatus === 'pro')
    const [pendingSourceChanges, setPendingSourceChanges] = useState<PendingSourceChanges[]>([])

    const refreshLicense = async () => {
        const status = await validateLicenseStatus()
        setIsPro(status === 'pro')
    }

    useEffect(() => {
        setActiveProject(project)
    }, [project])

    useEffect(() => {
        setPendingSourceChanges([])
        checkSources(project)
            .then(setPendingSourceChanges)
            .catch(() => { })
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
                case MenuActions.SETTINGS: {
                    if (isTauri()) {
                        await openSettingsWindow()
                    }
                    break
                }
            }
        })

        return unlisten
    }, [project])

    return (
        <LicenseContext.Provider value={{ isPro, refreshLicense }}>
            <App
                key={project.path}
                project={project}
                isTemp={project.path === tempPath}
                pendingSourceChanges={pendingSourceChanges}
                onApply={async () => {
                    await applySourceChanges(pendingSourceChanges, project)
                    setPendingSourceChanges([])
                    checkSources(project).then(setPendingSourceChanges).catch(() => { })
                }}
            />
            <ImportData project={project} />
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
            <Toaster />
        </LicenseContext.Provider>
    )
}


function RootComponent() {
    if (windowLabel === 'settings') {
        return <SettingsWindow />
    }
    return (
        <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN} options={options}>
            <AppShell />
        </PostHogProvider>
    )
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider>
            <TooltipProvider>
                <RootComponent />
            </TooltipProvider>
        </ThemeProvider>
    </React.StrictMode>,
);
