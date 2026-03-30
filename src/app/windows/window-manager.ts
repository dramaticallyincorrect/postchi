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
