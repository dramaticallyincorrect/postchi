import { isTauri } from "@tauri-apps/api/core"

const isWindows = () =>
    isTauri()
        ? navigator.userAgent.includes('Windows')
        : false

export const pathOf = (...parts: string[]): string => {
    if (isWindows()) {
        return parts.join('\\')
    }
    return parts.join('/')
}