import { loadStore } from '../data/store/store'
import { isTauri } from '@tauri-apps/api/core'

const LICENSE_KEY = 'licenseKey'
const SETTINGS_STORE = 'settings.json'
const LICENSE_API_BASE = 'https://api.getpostchi.app'
const LICENSE_PATTERN = /^CHI-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type LicenseStatus = 'free' | 'pro'

export async function getStoredLicense(): Promise<string | null> {
    const store = await loadStore(SETTINGS_STORE)
    return store.get<string>(LICENSE_KEY)
}

export async function saveLicense(key: string): Promise<void> {
    const store = await loadStore(SETTINGS_STORE)
    await store.set(LICENSE_KEY, key)
    await store.save()
}

export function isValidLicenseFormat(key: string): boolean {
    return LICENSE_PATTERN.test(key.trim())
}

export async function getAppVersion(): Promise<string> {
    if (!isTauri()) return '0.0.0'
    const { getVersion } = await import('@tauri-apps/api/app')
    return getVersion()
}

export async function validateLicense(key: string): Promise<{ isValid: boolean; errorMessage?: string }> {
    const version = await getAppVersion()
    const url = `${LICENSE_API_BASE}/verifyLicence?key=${encodeURIComponent(key)}&version=${encodeURIComponent(version)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Network error')
    return res.json()
}

export async function openBuyPage(): Promise<void> {
    const url = 'https://getpostchi.com/pricing'
    if (isTauri()) {
        const { openUrl } = await import('@tauri-apps/plugin-opener')
        await openUrl(url)
    } else {
        window.open(url, '_blank')
    }
}
