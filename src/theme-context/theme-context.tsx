import { applyThemeToCSSVars } from "@/lib/theme/theme-builder"
import { themes } from "@/lib/theme/themes"
import { createContext, useContext, useState } from "react"

type ThemeContextType = {
    theme: PostchiTheme
    setTheme: (theme: PostchiTheme) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: themes[0], setTheme: () => { } })

export const ThemeProvider = ({ initialTheme, children }: { initialTheme: PostchiTheme, children: React.ReactNode }) => {
    const [theme, setTheme] = useState<PostchiTheme>(initialTheme)


    const setThemeAndApply = (theme: PostchiTheme) => {
        setTheme(theme)
        applyThemeToCSSVars(theme)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme: setThemeAndApply }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}




