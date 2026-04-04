import { createContext, useContext, useEffect, useState } from 'react'
import { checkSources, SourceCheckResult } from '@/postchi/sources/source-checker'
import { Project } from '@/postchi/project/project'

type SourceCheckContextType = {
    result: SourceCheckResult | null
    refresh: () => void
}

const SourceCheckContext = createContext<SourceCheckContextType | null>(null)

export const SourceCheckProvider = ({ project, children }: { project: Project; children: React.ReactNode }) => {
    const [result, setResult] = useState<SourceCheckResult | null>(null)

    const refresh = () => {
        setResult(null)
        checkSources(project)
            .then(setResult)
            .catch(() => {})
    }

    useEffect(() => {
        refresh()
    }, [project])

    return (
        <SourceCheckContext.Provider value={{ result, refresh }}>
            {children}
        </SourceCheckContext.Provider>
    )
}

export const useSourceCheck = () => {
    const ctx = useContext(SourceCheckContext)
    if (!ctx) throw new Error('useSourceCheck must be used within SourceCheckProvider')
    return ctx
}
