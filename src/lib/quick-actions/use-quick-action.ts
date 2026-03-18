import { useCallback, useEffect } from 'react'
import { useFileWatch } from '../hooks/file-watch'
import usePersistentState from '../hooks/persistent-state'
import { readActionItems } from '../data/project-files'
import { filename } from '../data/files/file-utils/file-utils'
import { FileType } from '../data/supported-filetypes'

export type QuickAction = { name: string; path: string }


export function useQuickAction(actionsPath: string, projectPath: string) {
    const [actionPath, setActionPath] = usePersistentState<string | null>(
        `quickAction:${projectPath}`,
        null
    )

    const refreshActions = useCallback(async () => {
        try {
            const entries = await readActionItems(actionsPath)
            if (entries.length === 0) {
                setActionPath(null)
                return
            } else {
                const existingAction = entries.find(entry => entry.path === actionPath)
                if (existingAction) return
                const [first] = entries
                setActionPath(first.path)
            }
        } catch {

        }
    }, [actionsPath, actionPath])

    useFileWatch(actionsPath, refreshActions)

    useEffect(() => { refreshActions() }, [refreshActions])
    useFileWatch(actionsPath, refreshActions)



    const action = actionPath ? { name: actionName(actionPath), path: actionPath } : null

    return { action, setAction: setActionPath }
}

function actionName(path: string): string {
    const name = filename(path)
    const end = name.lastIndexOf(FileType.QUICK_ACTION)
    return end !== -1 ? name.substring(0, end) : name
}
