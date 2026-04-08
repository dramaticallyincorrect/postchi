import { setPassword, getPassword, deletePassword } from 'tauri-plugin-keyring-api';

const prefix = import.meta.env.DEV ? 'dev' : ''

const SERVICE_NAME = 'postchi' + prefix

export async function getSourceToken(sourceUrl: string): Promise<string | null> {
    return getPassword(SERVICE_NAME, sourceUrl + prefix)
}

export async function setSourceToken(sourceUrl: string, token: string): Promise<void> {
    await setPassword(SERVICE_NAME, sourceUrl + prefix, token)
}

export async function deleteSourceToken(sourceUrl: string): Promise<void> {
    await deletePassword(SERVICE_NAME, sourceUrl + prefix)
}
