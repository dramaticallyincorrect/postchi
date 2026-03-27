import { createContext, useContext } from 'react'

interface LicenseContextValue {
    isPro: boolean
    refreshLicense: () => Promise<void>
}

export const LicenseContext = createContext<LicenseContextValue>({
    isPro: false,
    refreshLicense: async () => {},
})

export function useLicense(): LicenseContextValue {
    return useContext(LicenseContext)
}
