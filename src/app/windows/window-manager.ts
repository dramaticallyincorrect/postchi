import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

export async function openSettingsWindow() {
    const existing = await WebviewWindow.getByLabel('settings')
    if (existing) {
        await existing.setFocus()
        return
    }

    new WebviewWindow('settings', {
        url: '/?window=settings',
        title: 'Settings',
        width: 700,
        height: 520,
        resizable: false,
        hiddenTitle: true,
        titleBarStyle: 'overlay',
        // hiddenTitle: true,
    })
}

export async function openImportWindow(projectPath: string) {
    const existing = await WebviewWindow.getByLabel('import')
    if (existing) {
        await existing.setFocus()
        return
    }


    new WebviewWindow('import', {
        url: `/?window=import&project=${projectPath}`,
        title: 'Import',
        width: 700,
        height: 520,
        resizable: true,
        hiddenTitle: true,
        titleBarStyle: 'overlay',
    })
}
