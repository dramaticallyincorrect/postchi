import { loadStore } from './store'

function credentialKey(projectPath: string, sourcePath: string): string {
    return `source-token:${projectPath}:${sourcePath}`
}

export async function getSourceToken(projectPath: string, sourcePath: string): Promise<string | null> {
    const store = await loadStore('credentials.json')
    return store.get<string>(credentialKey(projectPath, sourcePath))
}

export async function setSourceToken(projectPath: string, sourcePath: string, token: string): Promise<void> {
    const store = await loadStore('credentials.json')
    await store.set(credentialKey(projectPath, sourcePath), token)
    await store.save()
}

export async function deleteSourceToken(projectPath: string, sourcePath: string): Promise<void> {
    const store = await loadStore('credentials.json')
    await store.delete(credentialKey(projectPath, sourcePath))
    await store.save()
}
