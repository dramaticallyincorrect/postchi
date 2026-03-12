import { type } from '@tauri-apps/plugin-os';
export const isTauri = () => typeof window !== 'undefined' && 'isTauri' in window && !!window.isTauri;

export const isMac = () => {
    if (isTauri()) {
        return type() === 'macos';
    } else {
        return navigator.platform.toUpperCase().includes('MAC')
    }
}

export const isDesktopMac = () => isTauri() && type() === 'macos';