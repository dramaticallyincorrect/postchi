import { ProjectEnvironment } from '@/active-environment/environment-context'
import type { Project } from '@/lib/data/project/project'

let _project: Project | null = null
let _activeEnvironment: ProjectEnvironment = { name: '', variables: [], secrets: [] }

export function setActiveProject(project: Project | null): void { _project = project }
export function getActiveProject(): Project | null { return _project }
export function setActiveEnvironment(env: ProjectEnvironment | null): void { _activeEnvironment = env ?? { name: '', variables: [], secrets: [] } }
export function getActiveEnvironment(): ProjectEnvironment | null { return _activeEnvironment }

export function getProjectState() {
    return {
        project: _project!,
        environment: _activeEnvironment
    }
}

export type ProjectState = ReturnType<typeof getProjectState>