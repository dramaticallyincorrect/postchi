import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { isDesktopMac } from '../utils/os'

function platformTitlebarOptions() {
    if (isDesktopMac()) {
        return {
            titleBarStyle: 'overlay' as const,
            hiddenTitle: true,
            trafficLightPosition: { x: 14, y: 24 },
        }
    }
    return {
        decorations: false,
    }
}

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
