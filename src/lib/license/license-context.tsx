import { createContext, useContext } from 'react'

interface LicenseContextValue {
    isPro: boolean
    openLicenseDialog: () => void
    refreshLicense: () => Promise<void>
}

export const LicenseContext = createContext<LicenseContextValue>({
    isPro: false,
    openLicenseDialog: () => {},
    refreshLicense: async () => {},
})

export function useLicense(): LicenseContextValue {
    return useContext(LicenseContext)
}
