import readEnvironments from "@/lib/data/project/read-environments"
import { Environment } from "@/lib/environments/parser/environments-parser"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState, } from "react"
import { useFileWatch } from "@/lib/hooks/file-watch"

type VariablesContextType = {
    environments: Environment[]
    activeEnvironment: Environment | null
    setActiveEnvironment: (env: Environment) => void
    reload: () => Promise<void>
    envPath: string
}

const EnvironmentContext = createContext<VariablesContextType | null>(null)

export const EnvironmentProvider = ({ path, children }: { path: string, children: ReactNode }) => {
    const [environments, setEnvironments] = useState<Environment[]>([])
    const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null)

    const reload = useCallback(async () => {
        const envs = await readEnvironments(path)
        setEnvironments(envs)
        setActiveEnvironment(prev =>
            // keep the active one if it still exists, otherwise use first
            envs.find(e => e.name === prev?.name) ?? envs[0] ?? null
        )
    }, [path])

    useEffect(() => { reload() }, [path])

    useFileWatch(path, reload, { ignoreModified: false })

    return (
        <EnvironmentContext.Provider value={{ environments, activeEnvironment, setActiveEnvironment, reload, envPath: path }}>
            {children}
        </EnvironmentContext.Provider>
    )
}

export const useEnvironment = () => {
    const ctx = useContext(EnvironmentContext)
    if (!ctx) throw new Error('useEnvironment must be used within EnvironmentProvider')
    return ctx
}