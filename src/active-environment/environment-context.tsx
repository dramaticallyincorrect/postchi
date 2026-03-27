import readEnvironments from "@/lib/data/project/read-environments"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState, } from "react"
import { useFileWatch } from "@/lib/hooks/file-watch"
import { Project } from "@/lib/data/project/project"
import { setActiveEnvironment as setProjectEnvironment } from "@/lib/project-state"

type VariablesContextType = {
    environments: ProjectEnvironment[]
    activeEnvironment: ProjectEnvironment | null
    setActiveEnvironment: (env: ProjectEnvironment) => void
    reload: () => Promise<void>
    envPath: string
    secretsPath: string
}

const EnvironmentContext = createContext<VariablesContextType | null>(null)

export const EnvironmentProvider = ({ project, children }: { project: Project, children: ReactNode }) => {
    const [environments, setEnvironments] = useState<ProjectEnvironment[]>([])
    const [activeEnvironment, setActiveEnvironment] = useState<ProjectEnvironment | null>(null)

    useEffect(() => {
        setProjectEnvironment(activeEnvironment)
    }, [activeEnvironment])

    const reload = useCallback(async () => {
        const envs = await readEnvironments(project.envPath)
        const secrets = await readEnvironments(project.secretsPath)
        const projectEnvs = envs.map(e => ({
            name: e.name,
            variables: e.variables,
            secrets: secrets.find(s => s.name === e.name)?.variables ?? []
        }))
        setEnvironments(projectEnvs)
        setActiveEnvironment(prev =>
            // keep the active one if it still exists, otherwise use first
            projectEnvs.find(e => e.name === prev?.name) ?? projectEnvs[0] ?? null
        )
    }, [project])

    useEffect(() => { reload() }, [project])

    useFileWatch(project.envPath, reload, { ignoreModified: false })
    useFileWatch(project.secretsPath, reload, { ignoreModified: false })

    return (
        <EnvironmentContext.Provider value={{ environments, activeEnvironment, setActiveEnvironment, reload, envPath: project.envPath, secretsPath: project.secretsPath }}>
            {children}
        </EnvironmentContext.Provider>
    )
}

export const useEnvironment = () => {
    const ctx = useContext(EnvironmentContext)
    if (!ctx) throw new Error('useEnvironment must be used within EnvironmentProvider')
    return ctx
}

export type ProjectEnvironment = {
    name: string
    variables: { key: string, value: string }[]
    secrets: { key: string, value: string }[]
}