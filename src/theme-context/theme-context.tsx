import { PostchiTheme } from "@/lib/theme/theme"
import { applyThemeToCSSVars, deriveTheme, ThemeDisplayOptions } from "@/lib/theme/theme-builder"
import { themes } from "@/lib/theme/themes"
import usePersistentState from "@/lib/hooks/persistent-state"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

type ThemeContextType = {
    theme: PostchiTheme
    setTheme: (theme: PostchiTheme) => void
    inverted: boolean
    setInverted: (v: boolean) => void
    gapless: boolean
    setGapless: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextType>({
    theme: themes[1],
    setTheme: () => { },
    inverted: false,
    setInverted: () => { },
    gapless: false,
    setGapless: () => { },
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {

    const [themeId, setThemeId] = usePersistentState<string>('themeId', themes[1].id, 'settings.json')
    const [inverted, setInverted] = usePersistentState<boolean>('themeInverted', true, 'settings.json')
    const [gapless, setGapless] = usePersistentState<boolean>('themeGapless', true, 'settings.json')
    const [initialized, setInitialized] = useState(false)

    const baseTheme = useMemo(
        () => themes.find(t => t.id === themeId) ?? themes[1],
        [themeId]
    )

    const options: ThemeDisplayOptions = useMemo(
        () => ({ inverted, gapless }),
        [inverted, gapless]
    )

    const theme = useMemo(
        () => deriveTheme(baseTheme, options),
        [baseTheme, options]
    )

    useEffect(() => {
        applyThemeToCSSVars(theme, options)
        setInitialized(true)
    }, [theme, options])

    const setTheme = useCallback((newTheme: PostchiTheme) => {
        setThemeId(newTheme.id)
    }, [setThemeId])

    if (!initialized) {
        applyThemeToCSSVars(theme, options)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, inverted, setInverted, gapless, setGapless }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
