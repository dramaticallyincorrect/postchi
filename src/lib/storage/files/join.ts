import { isTauri } from "@tauri-apps/api/core"

const isWindows = () =>
    isTauri()
        ? navigator.userAgent.includes('Windows')
        : false

export const pathOf = (...parts: string[]): string => {
    if (isWindows()) {
        return parts.map(noTrailingSlash).join('\\')
    }
    return parts.map(noTrailingSlash).join('/')
}

const noTrailingSlash = (v:string) => {
    return v.replace(/[\/\\]+$/, '')
}